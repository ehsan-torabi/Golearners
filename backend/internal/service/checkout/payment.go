// Payment initiation + idempotent callback handling (docs/05 §2, §7).
package checkout

import (
	"context"
	"errors"
	"fmt"
	"net/url"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// InitiatePayment starts (or restarts) a gateway session for an order.
func (s *Service) InitiatePayment(ctx context.Context, userID, orderID uuid.UUID, gw commerce.Gateway) (*commerce.Payment, string, error) {
	o, err := s.d.Orders.ByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, "", apperr.ErrNotFound
		}
		return nil, "", err
	}
	if o.UserID != userID {
		return nil, "", apperr.ErrNotFound // do not leak other users' orders
	}
	if o.Status != commerce.OrderAwaitingPayment {
		return nil, "", apperr.ErrOrderNotPayable
	}
	if o.Expired(s.now()) {
		return nil, "", apperr.ErrOrderExpired
	}
	gateway, err := s.d.Gateways.Gateway(gw)
	if err != nil {
		return nil, "", apperr.ErrGatewayNotConfigured.Wrap(err)
	}

	// one in-flight attempt at a time: supersede a stale one
	if active, err := s.d.Payments.ActiveForOrder(ctx, o.ID); err == nil {
		_ = s.d.Payments.MarkFailed(ctx, active.ID, "superseded by retry")
		_ = s.d.Events.Insert(ctx, eventOf(active.ID, "superseded", nil))
	} else if !errors.Is(err, ports.ErrNotFound) {
		return nil, "", err
	}

	p := &commerce.Payment{
		ID: uuid.Must(uuid.NewV7()), OrderID: o.ID, Gateway: gw,
		AmountRial: o.TotalRial, Status: commerce.PaymentInitiated,
		IdempotencyKey: uuid.Must(uuid.NewV7()).String(),
	}
	if err := s.d.Payments.Create(ctx, p); err != nil {
		return nil, "", err
	}
	callback := s.d.BaseURL + "/api/v1/payments/callback/" + string(gw)
	_ = s.d.Events.Insert(ctx, eventOf(p.ID, commerce.EventRequestSent, map[string]any{"amount": p.AmountRial}))

	res, err := gateway.Initiate(ctx, ports.InitiateRequest{
		OrderID: o.ID, AmountRial: o.TotalRial,
		CallbackURL: callback, Description: "GoLearn order " + o.ID.String(),
	})
	if err != nil {
		_ = s.d.Payments.MarkFailed(ctx, p.ID, "initiate failed: "+err.Error())
		_ = s.d.Events.Insert(ctx, eventOf(p.ID, "request_failed", map[string]any{"err": err.Error()}))
		return nil, "", err
	}
	if err := s.d.Payments.MarkRedirected(ctx, p.ID, res.GatewayRef); err != nil {
		return nil, "", err
	}
	_ = s.d.Events.Insert(ctx, eventOf(p.ID, commerce.EventRequestOK, map[string]any{"ref": res.GatewayRef}))
	p.GatewayRef = &res.GatewayRef
	p.Status = commerce.PaymentRedirected
	return p, res.RedirectURL, nil
}

// Outcome is the callback result for the redirect page.
type Outcome struct {
	OrderID     uuid.UUID
	Paid        bool
	AlreadyDone bool
}

// HandleCallback verifies server-side and completes the payment idempotently:
// duplicate callbacks and verify code 101 are both safe (docs/05 §2).
func (s *Service) HandleCallback(ctx context.Context, gw commerce.Gateway, values url.Values) (*Outcome, error) {
	gateway, err := s.d.Gateways.Gateway(gw)
	if err != nil {
		return nil, apperr.ErrGatewayNotConfigured.Wrap(err)
	}
	cb, err := gateway.ParseCallback(values)
	if err != nil {
		return nil, apperr.ErrValidation.Wrap(err)
	}
	p, err := s.d.Payments.ByGatewayRef(ctx, gw, cb.GatewayRef)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			// unmatched ref: cheap reject, no state change (docs/07 §4)
			return nil, apperr.ErrValidation.Wrap(fmt.Errorf("unknown payment reference"))
		}
		return nil, err
	}
	_ = s.d.Events.Insert(ctx, eventOf(p.ID, commerce.EventCallbackReceived, map[string]any{"status": cb.Status}))

	// already-terminal payments answer idempotently
	if p.Status == commerce.PaymentVerified {
		o, err := s.d.Orders.ByID(ctx, p.OrderID)
		if err != nil {
			return nil, err
		}
		return &Outcome{OrderID: o.ID, Paid: true, AlreadyDone: true}, nil
	}
	if p.Status == commerce.PaymentFailed || p.Status == commerce.PaymentReversed {
		return &Outcome{OrderID: p.OrderID, Paid: false, AlreadyDone: true}, nil
	}

	// NOK: the buyer canceled or the PSP failed — no verify call (ZarinPal rule)
	if cb.Status != "OK" {
		_ = s.d.Payments.MarkFailed(ctx, p.ID, "gateway status "+cb.Status)
		return &Outcome{OrderID: p.OrderID, Paid: false}, nil
	}

	// server-side verify; amount equality re-checked inside
	vr, err := gateway.Verify(ctx, ports.VerifyRequest{
		GatewayRef: cb.GatewayRef, AmountRial: p.AmountRial, Raw: cb.Raw,
	})
	if err != nil {
		_ = s.d.Payments.MarkFailed(ctx, p.ID, "verify failed: "+err.Error())
		_ = s.d.Events.Insert(ctx, eventOf(p.ID, commerce.EventVerifyFailed, map[string]any{"err": err.Error()}))
		return &Outcome{OrderID: p.OrderID, Paid: false}, nil
	}
	_ = s.d.Events.Insert(ctx, eventOf(p.ID, commerce.EventVerifyOK, map[string]any{"already": vr.AlreadyVerified}))

	won, err := s.completePayment(ctx, p, vr.CardMasked)
	if err != nil {
		return nil, err
	}
	return &Outcome{OrderID: p.OrderID, Paid: true, AlreadyDone: !won}, nil
}

// completePayment runs the money-critical transaction: payment → paid,
// order → paid, coupon redemption, entitlement grants.
func (s *Service) completePayment(ctx context.Context, p *commerce.Payment, cardMasked string) (bool, error) {
	var won bool
	err := s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		w, err := s.d.Payments.MarkVerified(ctx, p.ID, cardMasked)
		if err != nil {
			return err
		}
		if !w {
			return nil // concurrent callback completed it — idempotent no-op
		}
		won = true
		paid, err := s.d.Orders.MarkPaid(ctx, p.OrderID)
		if err != nil {
			return err
		}
		if !paid {
			return fmt.Errorf("order %s was not awaiting payment", p.OrderID)
		}
		items, err := s.d.Orders.ItemsOf(ctx, p.OrderID)
		if err != nil {
			return err
		}
		o, err := s.d.Orders.ByID(ctx, p.OrderID)
		if err != nil {
			return err
		}
		for _, it := range items {
			e := &ports.Entitlement{}
			e.ID = uuid.Must(uuid.NewV7())
			e.UserID = o.UserID
			e.CourseID = it.CourseID
			e.Source = course.EntitlementPurchase
			e.OrderID = &p.OrderID
			if err := s.d.Entitlements.Grant(ctx, e); err != nil {
				return err
			}
		}
		if o.CouponID != nil {
			// best-effort redemption record (order is already paid)
			if err := s.d.Coupons.Redeem(ctx, *o.CouponID, o.UserID, o.ID); err != nil {
				_ = s.d.Events.Insert(ctx, eventOf(p.ID, "coupon_redeem_failed", map[string]any{"err": err.Error()}))
			}
		}
		return nil
	})
	return won, err
}
