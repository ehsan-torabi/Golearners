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

// CreateOrderInput is the checkout payload; CourseIDs is the cart.
type CreateOrderInput struct {
	CourseIDs  []uuid.UUID
	CouponCode string
}

// CreateOrder snapshots the cart's prices, applies the coupon if valid, and
// stores the order with a 30-minute payment window.
func (s *Service) CreateOrder(ctx context.Context, userID uuid.UUID, in CreateOrderInput) (*commerce.Order, error) {
	ids := dedupeIDs(in.CourseIDs)
	if len(ids) == 0 {
		return nil, apperr.ErrValidation
	}
	now := s.now()
	courses := make([]*course.Course, 0, len(ids))
	for _, id := range ids {
		c, err := s.d.Courses.ByID(ctx, id)
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
		courses = append(courses, c)
	}

	var subtotal int64
	for _, c := range courses {
		subtotal += c.PriceRial
	}

	o := &commerce.Order{
		ID:           uuid.Must(uuid.NewV7()),
		UserID:       userID,
		Status:       commerce.OrderAwaitingPayment,
		SubtotalRial: subtotal,
		ExpiresAt:    now.Add(commerce.OrderTTL),
	}
	items := make([]commerce.OrderItem, 0, len(courses))
	for _, c := range courses {
		items = append(items, commerce.OrderItem{
			ID: uuid.Must(uuid.NewV7()), OrderID: o.ID, CourseID: c.ID,
			TitleSnapshot: c.Title, UnitPriceRial: c.PriceRial,
		})
	}

	if strings.TrimSpace(in.CouponCode) != "" {
		coupon, err := s.validateCouponFor(ctx, userID, courses, subtotal, in.CouponCode)
		if err != nil {
			return nil, err
		}
		discount, err := coupon.DiscountFor(couponBase(courses, subtotal, coupon))
		if err != nil {
			return nil, apperr.ErrCouponInvalid.Wrap(err)
		}
		o.CouponID = &coupon.ID
		o.DiscountRial = discount
	}
	o.TotalRial = o.SubtotalRial - o.DiscountRial
	if o.TotalRial < 0 {
		o.TotalRial = 0
	}

	if err := s.d.Orders.Create(ctx, o, items); err != nil {
		return nil, err
	}

	// Free order (100% discount or free cart): paid without a gateway,
	// entitlements granted immediately, coupon redeemed — one transaction.
	if o.TotalRial == 0 {
		if err := s.finalizeFreeOrder(ctx, o, items); err != nil {
			return nil, err
		}
		o.Status = commerce.OrderPaid
		o.PaidAt = &now
	}

	return o, nil
}

// finalizeFreeOrder marks a zero-total order paid, grants entitlements and
// redeems the coupon in a single transaction (no gateway involved).
func (s *Service) finalizeFreeOrder(ctx context.Context, o *commerce.Order, items []commerce.OrderItem) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		paid, err := s.d.Orders.MarkPaid(ctx, o.ID)
		if err != nil {
			return err
		}
		if !paid {
			return fmt.Errorf("order %s was not awaiting payment", o.ID)
		}
		for _, it := range items {
			e := &ports.Entitlement{}
			e.ID = uuid.Must(uuid.NewV7())
			e.UserID = o.UserID
			e.CourseID = it.CourseID
			e.Source = course.EntitlementPurchase
			e.OrderID = &o.ID
			if err := s.d.Entitlements.Grant(ctx, e); err != nil {
				return err
			}
		}
		if o.CouponID != nil {
			// redemption is idempotent (unique coupon+order)
			_ = s.d.Coupons.Redeem(ctx, *o.CouponID, o.UserID, o.ID)
		}
		return nil
	})
}

// CouponPreview is the validation response.
type CouponPreview struct {
	Code         string `json:"code"`
	DiscountRial int64  `json:"discount_rial"`
	TotalRial    int64  `json:"total_rial"`
}

// ValidateCoupon previews a coupon against a cart of courses.
func (s *Service) ValidateCoupon(ctx context.Context, userID uuid.UUID, courseIDs []uuid.UUID, code string) (*CouponPreview, error) {
	ids := dedupeIDs(courseIDs)
	if len(ids) == 0 {
		return nil, apperr.ErrValidation
	}
	var subtotal int64
	courses := make([]*course.Course, 0, len(ids))
	for _, id := range ids {
		c, err := s.d.Courses.ByID(ctx, id)
		if err != nil {
			if errors.Is(err, ports.ErrNotFound) {
				return nil, apperr.ErrNotFound
			}
			return nil, err
		}
		subtotal += c.PriceRial
		courses = append(courses, c)
	}
	coupon, err := s.validateCouponFor(ctx, userID, courses, subtotal, code)
	if err != nil {
		return nil, err
	}
	base := couponBase(courses, subtotal, coupon)
	discount, err := coupon.DiscountFor(base)
	if err != nil {
		return nil, apperr.ErrCouponInvalid.Wrap(err)
	}
	return &CouponPreview{
		Code: coupon.Code, DiscountRial: discount, TotalRial: subtotal - discount,
	}, nil
}

// validateCouponFor applies every coupon rule and returns a granular reason
// when the coupon cannot apply (docs/01 US-C2). subtotal is the cart total;
// a course-scoped coupon only acts on its scoped course's price, so adding
// other courses cannot inflate the discount.
func (s *Service) validateCouponFor(ctx context.Context, userID uuid.UUID, courses []*course.Course, subtotal int64, rawCode string) (*commerce.Coupon, error) {
	coupon, err := s.d.Coupons.ByCode(ctx, rawCode)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrCouponInvalid
		}
		return nil, err
	}
	now := s.now()
	if coupon.Status != "active" {
		return nil, apperr.ErrCouponNotActive
	}
	if coupon.StartsAt != nil && now.Before(*coupon.StartsAt) {
		return nil, apperr.ErrCouponNotActive
	}
	if coupon.EndsAt != nil && now.After(*coupon.EndsAt) {
		return nil, apperr.ErrCouponExpired
	}
	if coupon.CourseScope != nil && !hasCourse(courses, *coupon.CourseScope) {
		return nil, apperr.ErrCouponScopeMismatch
	}
	base := couponBase(courses, subtotal, coupon)
	if coupon.MinAmountRial != nil && base < *coupon.MinAmountRial {
		return nil, apperr.ErrCouponMinAmount
	}
	if coupon.MaxUses != nil {
		uses, err := s.d.Coupons.CountUses(ctx, coupon.ID)
		if err != nil {
			return nil, err
		}
		if uses >= *coupon.MaxUses {
			return nil, apperr.ErrCouponExhausted
		}
	}
	if coupon.PerUserLimit != nil {
		uses, err := s.d.Coupons.CountUsesByUser(ctx, coupon.ID, userID)
		if err != nil {
			return nil, err
		}
		if uses >= *coupon.PerUserLimit {
			return nil, apperr.ErrCouponPerUserLimit
		}
	}
	if coupon.FirstPurchaseOnly {
		// first-purchase-only: the user must not already own any cart course
		for _, c := range courses {
			owned, err := s.d.Entitlements.HasActive(ctx, userID, c.ID)
			if err != nil {
				return nil, err
			}
			if owned {
				return nil, apperr.ErrCouponFirstPurchase
			}
		}
	}
	return coupon, nil
}

// couponBase picks the amount a coupon acts on: the whole cart, or the
// scoped course's price (0 when that course is not in the cart).
func couponBase(courses []*course.Course, subtotal int64, coupon *commerce.Coupon) int64 {
	if coupon.CourseScope == nil {
		return subtotal
	}
	for _, c := range courses {
		if c.ID == *coupon.CourseScope {
			return c.PriceRial
		}
	}
	return 0
}

func hasCourse(courses []*course.Course, id uuid.UUID) bool {
	for _, c := range courses {
		if c.ID == id {
			return true
		}
	}
	return false
}

func dedupeIDs(ids []uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]bool, len(ids))
	out := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		if id == uuid.Nil || seen[id] {
			continue
		}
		seen[id] = true
		out = append(out, id)
	}
	return out
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

// checkCouponUsable re-applies usage caps at payment time.
func (s *Service) checkCouponUsable(ctx context.Context, o *commerce.Order, coupon *commerce.Coupon) error {
	now := s.now()
	if coupon.Status != "active" {
		return apperr.ErrCouponNotActive
	}
	if coupon.EndsAt != nil && now.After(*coupon.EndsAt) {
		return apperr.ErrCouponExpired
	}
	if coupon.MaxUses != nil {
		uses, err := s.d.Coupons.CountUses(ctx, coupon.ID)
		if err != nil {
			return err
		}
		if uses >= *coupon.MaxUses {
			return apperr.ErrCouponExhausted
		}
	}
	if coupon.PerUserLimit != nil {
		uses, err := s.d.Coupons.CountUsesByUser(ctx, coupon.ID, o.UserID)
		if err != nil {
			return err
		}
		if uses >= *coupon.PerUserLimit {
			return apperr.ErrCouponPerUserLimit
		}
	}
	return nil
}
