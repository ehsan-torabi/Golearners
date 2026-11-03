// Admin order management + refunds.
package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/service/checkout"
)

// GET /api/v1/admin/orders?status=
func (a *App) handleAdminOrders(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.Checkout.ListAdmin(r.Context(), ports.OrderAdminFilter{
		Status: r.URL.Query().Get("status"),
		Q:      r.URL.Query().Get("q"),
		Sort:   r.URL.Query().Get("sort"),
	}, page, perPage)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	items := make([]map[string]any, 0, len(list))
	for _, o := range list {
		// the buyer is the first thing an admin needs; one lookup per row.
		userName, userMobile := "", ""
		if u, err := a.Auth.Me(r.Context(), o.UserID); err == nil && u != nil {
			userName = u.FullName
			userMobile = u.Mobile
		}
		items = append(items, map[string]any{
			"id": o.ID, "user_id": o.UserID, "status": o.Status,
			"subtotal_rial": o.SubtotalRial, "discount_rial": o.DiscountRial,
			"total_rial": o.TotalRial, "paid_at": o.PaidAt, "created_at": o.CreatedAt,
			"user_name": userName, "user_mobile": userMobile,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"data": items, "meta": map[string]any{"page": page, "per_page": perPage, "total": total},
	})
}

// GET /api/v1/admin/orders/{id} — includes payment events for support.
func (a *App) handleAdminOrder(w http.ResponseWriter, r *http.Request) {
	orderID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	o, items, payments, events, err := a.Checkout.OrderDetailForAdmin(r.Context(), orderID)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	out := orderJSON(o, items)
	pays := make([]map[string]any, 0, len(payments))
	for _, p := range payments {
		pays = append(pays, map[string]any{
			"id": p.ID, "gateway": p.Gateway, "status": p.Status,
			"gateway_ref": p.GatewayRef, "amount_rial": p.AmountRial,
			"card_masked": p.CardMasked, "failure_reason": p.FailureReason,
			"created_at": p.CreatedAt, "verified_at": p.VerifiedAt,
		})
	}
	out["payments"] = pays
	out["events"] = events
	writeJSON(w, http.StatusOK, out)
}

type refundRequest struct {
	Reason string `json:"reason"`
}

// POST /api/v1/admin/orders/{id}/refund
func (a *App) handleAdminOrderRefund(w http.ResponseWriter, r *http.Request) {
	orderID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in refundRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	rf, err := a.Checkout.RefundOrder(r.Context(), checkout.Actor{
		ID: mustActor(r).ID, IP: clientIP(r), UserAgent: r.UserAgent(),
	}, orderID, checkout.RefundInput{Reason: in.Reason})
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, rf)
}

func mustActor(r *http.Request) identity.Actor {
	a, _ := actorFrom(r.Context())
	return a
}
