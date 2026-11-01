// Coupon admin CRUD handlers.
package httpapi

import (
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"context"
	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/domain/identity"
)

type couponRequest struct {
	Code          string     `json:"code"`
	Type          string     `json:"type"`
	Value         int64      `json:"value"`
	MaxUses       *int       `json:"max_uses"`
	PerUserLimit  *int       `json:"per_user_limit"`
	MinAmountRial *int64     `json:"min_amount_rial"`
	StartsAt      *time.Time `json:"starts_at"`
	EndsAt        *time.Time `json:"ends_at"`
	CourseScope   *uuid.UUID `json:"course_scope"`
	Status        string     `json:"status"`
}

func (a *App) couponFrom(in couponRequest) (*commerce.Coupon, error) {
	if len(in.Code) < 3 || len(in.Code) > 40 {
		return nil, apperr.ErrValidation
	}
	t := commerce.CouponType(in.Type)
	if t != commerce.CouponPercent && t != commerce.CouponFixed {
		return nil, apperr.ErrValidation
	}
	if in.Value <= 0 || (t == commerce.CouponPercent && in.Value > 100) {
		return nil, apperr.ErrValidation
	}
	status := in.Status
	if status == "" {
		status = "active"
	}
	return &commerce.Coupon{
		Code: strings.ToUpper(in.Code), Type: t, Value: in.Value,
		MaxUses: in.MaxUses, PerUserLimit: in.PerUserLimit, MinAmountRial: in.MinAmountRial,
		StartsAt: in.StartsAt, EndsAt: in.EndsAt, CourseScope: in.CourseScope, Status: status,
	}, nil
}

func (a *App) auditAdmin(actor identity.Actor, action, entity, id string) {
	e := auditEntryNow(actor, action, entity, id)
	_ = a.Audit.Insert(context.Background(), &e)
}

// GET /api/v1/admin/coupons
func (a *App) handleAdminCouponList(w http.ResponseWriter, r *http.Request) {
	page, perPage := pageParams(r)
	list, total, err := a.Coupons.List(r.Context(), r.URL.Query().Get("status"), page, perPage)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list, "meta": map[string]any{"page": page, "per_page": perPage, "total": total}})
}

// POST /api/v1/admin/coupons
func (a *App) handleAdminCouponCreate(w http.ResponseWriter, r *http.Request) {
	var in couponRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	c, err := a.couponFrom(in)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	c.ID = uuid.Must(uuid.NewV7())
	if err := a.Coupons.Create(r.Context(), c); err != nil {
		a.writeError(w, r, err)
		return
	}
	a.auditAdmin(mustActor(r), "coupon.create", "coupon", c.ID.String())
	writeJSON(w, http.StatusCreated, c)
}

// PATCH /api/v1/admin/coupons/{id}
func (a *App) handleAdminCouponUpdate(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	var in couponRequest
	if err := decodeJSON(w, r, &in); err != nil {
		a.writeError(w, r, err)
		return
	}
	c, err := a.couponFrom(in)
	if err != nil {
		a.writeError(w, r, err)
		return
	}
	c.ID = id
	if err := a.Coupons.Update(r.Context(), c); err != nil {
		a.writeError(w, r, err)
		return
	}
	a.auditAdmin(mustActor(r), "coupon.update", "coupon", id.String())
	writeData(w, c)
}

func (a *App) handleAdminCouponDelete(w http.ResponseWriter, r *http.Request) {
	id, err := uuidParam(r, "id")
	if err != nil {
		a.writeError(w, r, apperr.ErrValidation.Wrap(err))
		return
	}
	if err := a.Coupons.Delete(r.Context(), id); err != nil {
		a.writeError(w, r, err)
		return
	}
	a.auditAdmin(mustActor(r), "coupon.delete", "coupon", id.String())
	w.WriteHeader(http.StatusNoContent)
}
