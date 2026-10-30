// Scheduled commerce jobs: order expiry + payment reconciliation.
package worker

import (
	"context"
	"time"

	"github.com/hibiken/asynq"
)

// CommerceJobs is the checkout-service surface the worker needs.
type CommerceJobs interface {
	ExpireDueOrders(ctx context.Context) (int64, error)
	ReconcileStuck(ctx context.Context, olderThan time.Duration, limit int) (completed, failed int, err error)
}

// RegisterCommerce attaches scheduled handlers to the mux.
func RegisterCommerce(mux *asynq.ServeMux, d *Deps, jobs CommerceJobs) {
	mux.HandleFunc(TypeOrdersExpire, func(ctx context.Context, t *asynq.Task) error {
		n, err := jobs.ExpireDueOrders(ctx)
		if err != nil {
			return err
		}
		if n > 0 {
			d.Log.Info("expired stale orders", "count", n)
		}
		return nil
	})
	mux.HandleFunc(TypePaymentsReconcile, func(ctx context.Context, t *asynq.Task) error {
		completed, failed, err := jobs.ReconcileStuck(ctx, d.ReconcileAfter, 100)
		if err != nil {
			return err
		}
		if completed+failed > 0 {
			d.Log.Info("reconciled stuck payments", "completed", completed, "failed", failed)
		}
		return nil
	})
}
