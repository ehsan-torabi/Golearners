// Refunds (docs/05 §8) and reconciliation (docs/05 §7).
package checkout

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/ports"
)

// RefundInput for the admin action.
type RefundInput struct {
	Reason string
}

// Actor for audit rows.
type Actor struct {
	ID        uuid.UUID
	IP        string
	UserAgent string
}

// RefundOrder reverses a paid order: gateway reverse when the adapter
// supports it, recorded manual refund otherwise. Revokes entitlements.
func (s *Service) RefundOrder(ctx context.Context, actor Actor, orderID uuid.UUID, in RefundInput) (*commerce.Refund, error) {
	o, err := s.d.Orders.ByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	if o.Status != commerce.OrderPaid {
		return nil, apperr.ErrOrderNotPayable.Wrap(fmt.Errorf("refund requires a paid order"))
	}
	items, err := s.d.Orders.ItemsOf(ctx, o.ID)
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return nil, apperr.ErrInternal.Wrap(fmt.Errorf("order without items"))
	}

	// the verified payment of this order (latest attempt first)
	attempts, err := s.d.Payments.ListForOrder(ctx, o.ID)
	if err != nil {
		return nil, err
	}
	var verified *commerce.Payment
	for _, p := range attempts {
		if p.Status == commerce.PaymentVerified {
			verified = p
			break
		}
	}
	if verified == nil {
		return nil, apperr.ErrInternal.Wrap(fmt.Errorf("no verified payment"))
	}
	if existing, err := s.d.Refunds.ForPayment(ctx, verified.ID); err == nil && existing != nil {
		return nil, apperr.ErrOrderNotPayable.Wrap(fmt.Errorf("already refunded"))
	}

	gateway, gerr := s.d.Gateways.Gateway(verified.Gateway)
	kind := commerce.RefundManual
	var gatewayRef *string
	if gerr == nil {
		res, rerr := gateway.Refund(ctx, ports.RefundRequest{
			GatewayRef: ptrStr(verified.GatewayRef), AmountRial: verified.AmountRial,
		})
		switch {
		case rerr == nil && res.OK:
			kind = commerce.RefundGatewayReverse
			gatewayRef = &res.GatewayRef
		case errors.Is(rerr, ports.ErrRefundUnsupported):
			// manual path (record only)
		default:
			return nil, apperr.ErrRefundFailed.Wrap(rerr)
		}
	}

	rf := &commerce.Refund{
		ID: uuid.Must(uuid.NewV7()), PaymentID: verified.ID,
		AmountRial: verified.AmountRial, Kind: kind, Reason: in.Reason,
		Status: commerce.RefundCompleted, GatewayRef: gatewayRef, ActedBy: &actor.ID,
	}
	err = s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Refunds.Create(ctx, rf); err != nil {
			return err
		}
		if kind == commerce.RefundGatewayReverse {
			if err := s.d.Payments.MarkReversed(ctx, verified.ID); err != nil {
				return err
			}
		}
		if err := s.d.Orders.MarkRefunded(ctx, o.ID); err != nil {
			return err
		}
		if err := s.d.Entitlements.RevokeByOrder(ctx, o.ID); err != nil {
			return err
		}
		entry := &ports.AuditEntry{
			ID: uuid.Must(uuid.NewV7()), ActorID: &actor.ID,
			Action: "order.refund", EntityType: "order", EntityID: strPtr(o.ID.String()),
			IP: actor.IP, UserAgent: actor.UserAgent,
		}
		return s.d.Audit.Insert(ctx, entry)
	})
	if err != nil {
		return nil, err
	}
	return rf, nil
}

// ReconcileStuck verifies or fails redirected payments older than the
// threshold; runs on a schedule from the worker (docs/05 §7).
func (s *Service) ReconcileStuck(ctx context.Context, olderThan time.Duration, limit int) (completed, failed int, err error) {
	stuck, err := s.d.Payments.StuckForReconcile(ctx, olderThan, limit)
	if err != nil {
		return 0, 0, err
	}
	for _, p := range stuck {
		gateway, gerr := s.d.Gateways.Gateway(p.Gateway)
		if gerr != nil {
			_ = s.d.Payments.MarkFailed(ctx, p.ID, "gateway unavailable during reconcile")
			failed++
			continue
		}
		vr, verr := gateway.Verify(ctx, ports.VerifyRequest{
			GatewayRef: ptrStr(p.GatewayRef), AmountRial: p.AmountRial,
		})
		if verr != nil || !vr.OK {
			_ = s.d.Payments.MarkFailed(ctx, p.ID, "reconcile: verify failed")
			_ = s.d.Events.Insert(ctx, eventOf(p.ID, commerce.EventReconciled, map[string]any{"result": "failed"}))
			failed++
			continue
		}
		if _, err := s.completePayment(ctx, p, vr.CardMasked); err != nil {
			return completed, failed, err
		}
		_ = s.d.Events.Insert(ctx, eventOf(p.ID, commerce.EventReconciled, map[string]any{"result": "completed"}))
		completed++
	}
	return completed, failed, nil
}

// ExpireDueOrders flips stale awaiting_payment orders (worker schedule).
func (s *Service) ExpireDueOrders(ctx context.Context) (int64, error) {
	return s.d.Orders.ExpireDue(ctx, s.now())
}

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func strPtr(s string) *string { return &s }

// ListAdmin lists orders for the admin grid.
func (s *Service) ListAdmin(ctx context.Context, status string, page, perPage int) ([]*commerce.Order, int, error) {
	return s.d.Orders.ListAdmin(ctx, status, page, perPage)
}

// OrderDetailForAdmin returns order + items + payments + event ledger.
func (s *Service) OrderDetailForAdmin(ctx context.Context, orderID uuid.UUID) (*commerce.Order, []commerce.OrderItem, []*commerce.Payment, []*commerce.PaymentEvent, error) {
	o, err := s.d.Orders.ByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, nil, nil, nil, apperr.ErrNotFound
		}
		return nil, nil, nil, nil, err
	}
	items, err := s.d.Orders.ItemsOf(ctx, o.ID)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	payments, events := s.paymentHistory(ctx, o.ID)
	return o, items, payments, events, nil
}

// paymentHistory assembles all payment attempts + their event ledgers.
func (s *Service) paymentHistory(ctx context.Context, orderID uuid.UUID) ([]*commerce.Payment, []*commerce.PaymentEvent) {
	payments, err := s.d.Payments.ListForOrder(ctx, orderID)
	if err != nil {
		return nil, nil
	}
	var events []*commerce.PaymentEvent
	for _, p := range payments {
		if evs, err := s.d.Events.ListForPayment(ctx, p.ID); err == nil {
			events = append(events, evs...)
		}
	}
	return payments, events
}

var _ = json.Marshal
