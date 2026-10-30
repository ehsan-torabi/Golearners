// Command worker runs background jobs: media ingest + status polling.
package main

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/hibiken/asynq"

	"golearn/backend/internal/adapter/jobqueue"
	"golearn/backend/internal/adapter/payment"
	mockgw "golearn/backend/internal/adapter/payment/mock"
	"golearn/backend/internal/adapter/payment/zarinpal"
	"golearn/backend/internal/adapter/video/local"
	"golearn/backend/internal/platform/config"
	"golearn/backend/internal/platform/logger"
	"golearn/backend/internal/platform/postgres"
	"golearn/backend/internal/platform/storage"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/repository"
	"golearn/backend/internal/service/checkout"
	"golearn/backend/internal/worker"
)

func main() {
	if err := run(); err != nil {
		_, _ = os.Stderr.WriteString("worker: " + err.Error() + "\n")
		os.Exit(1)
	}
}

func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		return err
	}
	log, err := logger.New(cfg.LogLevel)
	if err != nil {
		return err
	}
	pool, err := postgres.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	st, err := storage.New(ctx, cfg)
	if err != nil {
		return err
	}
	var video ports.VideoPlatform
	switch cfg.VODProvider {
	case "arvanvod":
		return errors.New("arvanvod adapter awaits official docs (TODO(arvan-docs))")
	default:
		video = local.New(st, cfg.PlaybackTTL)
	}

	// gateway registry (same setup as the API)
	registry := payment.NewRegistry()
	registry.Register(mockgw.NewFromEnv())
	if cfg.ZarinpalMerchantID != "" {
		registry.Register(zarinpal.New(zarinpal.Config{
			MerchantID: cfg.ZarinpalMerchantID, Sandbox: cfg.ZarinpalSandbox,
		}))
	}

	client := asynq.NewClient(asynq.RedisClientOpt{Addr: cfg.RedisAddr})
	defer client.Close()

	srv := asynq.NewServer(asynq.RedisClientOpt{Addr: cfg.RedisAddr}, asynq.Config{
		Concurrency: 5,
		Queues:      map[string]int{"media": 10, "default": 5},
	})

	// checkout jobs share the worker (expiry + reconciliation)
	checkoutSvc := checkout.NewService(checkout.Deps{
		Orders:       repository.NewOrderRepo(pool),
		Coupons:      repository.NewCouponRepo(pool),
		Payments:     repository.NewPaymentRepo(pool),
		Events:       repository.NewPaymentEventRepo(pool),
		Refunds:      repository.NewRefundRepo(pool),
		Courses:      repository.NewCourseRepo(pool),
		Entitlements: repository.NewEntitlementRepo(pool),
		Gateways:     registry,
		TX:           repository.NewTransactor(pool),
		Audit:        repository.NewAuditRepo(pool),
		BaseURL:      cfg.BaseURL,
	})

	deps := worker.Deps{
		Media:          repository.NewMediaRepo(pool),
		Video:          video,
		Queue:          jobqueue.New(client),
		Log:            log,
		MaxPolls:       60,
		NextPollIn:     10 * time.Second,
		ReconcileAfter: 15 * time.Minute,
	}
	mux := worker.NewMux(deps)
	worker.RegisterCommerce(mux, &deps, checkoutSvc)

	// periodic scheduler: expire every 5 min, reconcile every 10 min
	scheduler := asynq.NewScheduler(asynq.RedisClientOpt{Addr: cfg.RedisAddr}, nil)
	_, _ = scheduler.Register("*/5 * * * *", asynq.NewTask(worker.TypeOrdersExpire, []byte("{}")))
	_, _ = scheduler.Register("*/10 * * * *", asynq.NewTask(worker.TypePaymentsReconcile, []byte("{}")))
	go func() {
		if err := scheduler.Run(); err != nil {
			log.Error("scheduler stopped", "err", err)
		}
	}()

	log.Info("worker starting", "vod", video.Name())
	return srv.Run(mux)
}
