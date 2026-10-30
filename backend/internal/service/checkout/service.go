// Package checkout implements the commerce use-cases: order creation with
// price snapshots, coupon validation, gateway payment with idempotent
// callbacks, refunds, and reconciliation (docs/05).
package checkout

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

type Deps struct {
	Orders       ports.OrderRepo
	Coupons      ports.CouponRepo
	Payments     ports.PaymentRepo
	Events       ports.PaymentEventRepo
	Refunds      ports.RefundRepo
	Courses      ports.CourseRepo
	Entitlements ports.EntitlementRepo
	Gateways     ports.GatewayRegistry
	TX           ports.Transactor
	Audit        ports.AuditRepo
	BaseURL      string // public site base for callback URLs
	Now          func() time.Time
}

type Service struct {
	d   Deps
	now func() time.Time
}

func NewService(d Deps) *Service {
	s := &Service{d: d, now: time.Now}
	if d.Now != nil {
		s.now = d.Now
	}
	return s
}

// CreateOrderInput is the checkout payload.
type CreateOrderInput struct {
	CourseID   uuid.UUID
	CouponCode string
}

// CreateOrder snapshots the price, applies the coupon if valid, and stores
// the order with a 30-minute payment window.
func (s *Service) CreateOrder(ctx context.Context, userID uuid.UUID, in CreateOrderInput) (*commerce.Order, error) {
	c, err := s.d.Courses.ByID(ctx, in.CourseID)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	if c.Status != course.StatusPublished {
		return nil, apperr.ErrNotFound
	}
	owned, err := s.d.Entitlements.HasActive(ctx, userID, c.ID)
	if err != nil {
		return nil, err
	}
	if owned {
		return nil, apperr.ErrAlreadyOwned
	}

	o := &commerce.Order{
		ID:           uuid.Must(uuid.NewV7()),
		UserID:       userID,
		Status:       commerce.OrderAwaitingPayment,
		SubtotalRial: c.PriceRial,
		ExpiresAt:    s.now().Add(commerce.OrderTTL),
	}
	items := []commerce.OrderItem{{
		ID: uuid.Must(uuid.NewV7()), OrderID: o.ID, CourseID: c.ID,
		TitleSnapshot: c.Title, UnitPriceRial: c.PriceRial,
	}}

	if strings.TrimSpace(in.CouponCode) != "" {
		coupon, err := s.validateCouponFor(ctx, userID, c, in.CouponCode)
		if err != nil {
			return nil, err
		}
		discount, err := coupon.DiscountFor(o.SubtotalRial)
		if err != nil {
			return nil, apperr.ErrCouponInvalid.Wrap(err)
		}
		o.CouponID = &coupon.ID
		o.DiscountRial = discount
	}
	o.TotalRial = o.SubtotalRial - o.DiscountRial
	if o.TotalRial < 0 {
		return nil, apperr.ErrInternal.Wrap(fmt.Errorf("negative total"))
	}

	if err := s.d.Orders.Create(ctx, o, items); err != nil {
		return nil, err
	}
	return o, nil
}

// CouponPreview is the validation response.
type CouponPreview struct {
	Code         string
	DiscountRial int64
	TotalRial    int64
}

// ValidateCoupon previews a coupon against a course price.
func (s *Service) ValidateCoupon(ctx context.Context, userID uuid.UUID, courseID uuid.UUID, code string) (*CouponPreview, error) {
	c, err := s.d.Courses.ByID(ctx, courseID)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	coupon, err := s.validateCouponFor(ctx, userID, c, code)
	if err != nil {
		return nil, err
	}
	discount, err := coupon.DiscountFor(c.PriceRial)
	if err != nil {
		return nil, apperr.ErrCouponInvalid.Wrap(err)
	}
	return &CouponPreview{
		Code: coupon.Code, DiscountRial: discount, TotalRial: c.PriceRial - discount,
	}, nil
}

// validateCouponFor applies every coupon rule (docs/01 US-C2).
func (s *Service) validateCouponFor(ctx context.Context, userID uuid.UUID, c *course.Course, rawCode string) (*commerce.Coupon, error) {
	coupon, err := s.d.Coupons.ByCode(ctx, rawCode)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrCouponInvalid
		}
		return nil, err
	}
	if !coupon.Active(s.now()) {
		return nil, apperr.ErrCouponInvalid.Wrap(fmt.Errorf("not active"))
	}
	if coupon.CourseScope != nil && *coupon.CourseScope != c.ID {
		return nil, apperr.ErrCouponInvalid.Wrap(fmt.Errorf("course scope mismatch"))
	}
	if coupon.MinAmountRial != nil && c.PriceRial < *coupon.MinAmountRial {
		return nil, apperr.ErrCouponInvalid.Wrap(fmt.Errorf("below min amount"))
	}
	if coupon.MaxUses != nil {
		uses, err := s.d.Coupons.CountUses(ctx, coupon.ID)
		if err != nil {
			return nil, err
		}
		if uses >= *coupon.MaxUses {
			return nil, apperr.ErrCouponInvalid.Wrap(fmt.Errorf("exhausted"))
		}
	}
	if coupon.PerUserLimit != nil {
		uses, err := s.d.Coupons.CountUsesByUser(ctx, coupon.ID, userID)
		if err != nil {
			return nil, err
		}
		if uses >= *coupon.PerUserLimit {
			return nil, apperr.ErrCouponInvalid.Wrap(fmt.Errorf("per-user limit"))
		}
	}
	return coupon, nil
}

func eventOf(paymentID uuid.UUID, etype string, payload any) *commerce.PaymentEvent {
	var raw []byte
	if payload != nil {
		raw, _ = json.Marshal(payload)
	}
	return &commerce.PaymentEvent{
		ID: uuid.Must(uuid.NewV7()), PaymentID: paymentID, Type: etype, Payload: raw,
	}
}

// ListForUser returns the caller's orders (ownership enforced).
func (s *Service) ListForUser(ctx context.Context, userID uuid.UUID, page, perPage int) ([]*commerce.Order, int, error) {
	return s.d.Orders.ListForUser(ctx, userID, page, perPage)
}

// OrderForUser returns one order + items, enforcing ownership.
func (s *Service) OrderForUser(ctx context.Context, userID, orderID uuid.UUID) (*commerce.Order, []commerce.OrderItem, error) {
	o, err := s.d.Orders.ByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, nil, apperr.ErrNotFound
		}
		return nil, nil, err
	}
	if o.UserID != userID {
		return nil, nil, apperr.ErrNotFound // IDOR: other users' orders look missing
	}
	items, err := s.d.Orders.ItemsOf(ctx, o.ID)
	if err != nil {
		return nil, nil, err
	}
	return o, items, nil
}

// PaymentsOfOrder lists gateway attempts of an order (receipt view).
func (s *Service) PaymentsOfOrder(ctx context.Context, orderID uuid.UUID) []*commerce.Payment {
	if p, err := s.d.Payments.ActiveForOrder(ctx, orderID); err == nil {
		return []*commerce.Payment{p}
	}
	return nil
}
