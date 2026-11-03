// Checkout + payment transport endpoints (docs/04 learner + admin).
package httpapi

import (
	"net/http"

	"github.com/google/uuid"

	"github.com/go-chi/chi/v5"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/service/checkout"
)

type checkoutRequest struct {
	// CourseIDs is the cart; CourseID is the legacy single-course field.
	CourseIDs  []uuid.UUID `json:"course_ids"`
	CourseID   uuid.UUID   `json:"course_id"`
	CouponCode string      `json:"coupon_code"`
}

// cartIDs merges the legacy single-course field into the id list.
func (r checkoutRequest) cartIDs() []uuid.UUID {
	if len(r.CourseIDs) > 0 {
		return r.CourseIDs
	}
	if r.CourseID != uuid.Nil {
		return []uuid.UUID{r.CourseID}
	}
	return nil
}

// POST /api/v1/checkout
func (a *App) handleCheckout(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	var in checkoutRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	o, err := a.Checkout.CreateOrder(r.Context(), actor.ID, checkout.CreateOrderInput{
		CourseIDs: in.cartIDs(), CouponCode: in.CouponCode,
	})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items, err := a.Orders.ItemsOf(r.Context(), o.ID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, orderJSON(o, items))
}

type payRequest struct {
	Gateway commerce.Gateway `json:"gateway"`
}

// POST /api/v1/checkout/{order_id}/pay
func (a *App) handleCheckoutPay(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	orderID, err := uuid.Parse(chi.URLParam(r, "order_id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in payRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	if !in.Gateway.Valid() {
		a.writeError(w, r, apperr.ErrValidation)
		return
	}
	p, redirect, err := a.Checkout.InitiatePayment(r.Context(), actor.ID, orderID, in.Gateway)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"payment_id": p.ID, "redirect_url": redirect,
	})
}

// POST|GET /api/v1/payments/callback/{gateway} — gateway redirect target;
// verifies server-side, then bounces the browser to the result page.
func (a *App) handlePaymentCallback(w http.ResponseWriter, r *http.Request) {
	gw := commerce.Gateway(chi.URLParam(r, "gateway"))
	if !gw.Valid() {
		a.writeError(w, r, apperr.ErrValidation)
		return
	}
	outcome, err := a.Checkout.HandleCallback(r.Context(), gw, r.URL.Query())
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	// The redirect carries the order id only: the outcome is decided by the
	// server when the page reads the order, never by a value in the URL.
	target := a.Cfg.BaseURL + "/checkout/result?order=" + outcome.OrderID.String()
	http.Redirect(w, r, target, http.StatusFound)
}

type couponValidateRequest struct {
	Code      string      `json:"code"`
	CourseIDs []uuid.UUID `json:"course_ids"`
	CourseID  uuid.UUID   `json:"course_id"` // legacy single-course field
}

// POST /api/v1/coupons/validate
func (a *App) handleCouponValidate(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	var in couponValidateRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	ids := in.CourseIDs
	if len(ids) == 0 && in.CourseID != uuid.Nil {
		ids = []uuid.UUID{in.CourseID}
	}
	preview, err := a.Checkout.ValidateCoupon(r.Context(), actor.ID, ids, in.Code)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, preview)
}

func orderJSON(o *commerce.Order, items []commerce.OrderItem) map[string]any {
	itemOut := make([]map[string]any, 0, len(items))
	for _, it := range items {
		itemOut = append(itemOut, map[string]any{
			"course_id": it.CourseID, "title_snapshot": it.TitleSnapshot,
			"unit_price_rial": it.UnitPriceRial,
		})
	}
	return map[string]any{
		"id": o.ID, "status": o.Status,
		"subtotal_rial": o.SubtotalRial, "discount_rial": o.DiscountRial,
		"total_rial": o.TotalRial, "coupon_id": o.CouponID,
		"expires_at": o.ExpiresAt, "paid_at": o.PaidAt,
		"items": itemOut,
	}
}

// GET /api/v1/me/orders
func (a *App) handleMyOrders(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	page, perPage := pageParams(r)
	list, total, err := a.Checkout.ListForUser(r.Context(), actor.ID, page, perPage)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	for _, o := range list {
		// titles let the orders list show what the order is for and offer
		// payment on the still-awaiting ones
		its, err := a.Orders.ItemsOf(r.Context(), o.ID)
		if err != nil {
			a.writeError(w, r, err)
			return
		}
		outs := make([]map[string]any, 0, len(its))
		for _, it := range its {
			outs = append(outs, map[string]any{
				"course_id": it.CourseID, "title_snapshot": it.TitleSnapshot,
				"unit_price_rial": it.UnitPriceRial,
			})
		}
		items = append(items, map[string]any{
			"id": o.ID, "status": o.Status, "total_rial": o.TotalRial,
			"discount_rial": o.DiscountRial, "expires_at": o.ExpiresAt,
			"paid_at": o.PaidAt, "created_at": o.CreatedAt, "items": outs,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"data": items, "meta": map[string]any{"page": page, "per_page": perPage, "total": total},
	})
}

// GET /api/v1/me/orders/{id}
func (a *App) handleMyOrder(w http.ResponseWriter, r *http.Request) {
	actor, ok := actorFrom(r.Context())
	if !ok {
		a.writeError(w, r, apperr.ErrUnauthenticated)
		return
	}
	orderID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	o, items, err := a.Checkout.OrderForUser(r.Context(), actor.ID, orderID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	payments := a.Checkout.PaymentsOfOrder(r.Context(), o.ID)
	writeJSON(w, http.StatusOK, orderWithPayments(o, items, payments))
}

func orderWithPayments(o *commerce.Order, items []commerce.OrderItem, payments []*commerce.Payment) map[string]any {
	out := orderJSON(o, items)
	pays := make([]map[string]any, 0, len(payments))
	for _, p := range payments {
		pays = append(pays, map[string]any{
			"id": p.ID, "gateway": p.Gateway, "status": p.Status,
			"amount_rial": p.AmountRial, "card_masked": p.CardMasked,
			"created_at": p.CreatedAt, "verified_at": p.VerifiedAt,
		})
	}
	out["payments"] = pays
	return out
}
