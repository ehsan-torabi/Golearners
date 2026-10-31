# GoLearn — Runbook

## Daily operations
- Health: `curl http://localhost:8080/healthz` (liveness), `/readyz` (postgres/redis/storage).
- Logs: `docker compose logs -f api worker` (slog JSON; grep by `request_id`).
- Admin panel: `/admin` (owner account via `cmd/bootstrap`).
- Mock gateway (dev/tests only): `go run ./cmd/mockgateway` on :8082 — never expose publicly.

## Deploy (compose, single node)
1. `cp .env.example .env` — fill production values (strong JWT_SECRET >=32 chars, DB password, S3 keys, gateway merchant IDs, SITE_URL).
2. Bring up infra; prod compose lands with the deployment phase (dev compose works today).
3. Migrations: `make migrate-up`. Bootstrap owner: `go run ./cmd/bootstrap -mobile ... -password ...`.
4. Backups: nightly `pg_dump` + MinIO mirror; 30-day retention; quarterly restore drill:
   `psql $URL < dump.sql && mc mirror s3/golearn-media local/golearn-media`.

## Payment gateway operations
- ZarinPal panel: set callback domain, whitelist server IP (needed for reverse/refund), sandbox first.
- Reconciliation: worker verifies stuck `redirected` payments every 10 min; `payment_events` holds the full ledger for disputes.
- Refunds: `/api/v1/admin/orders/{id}/refund` (ZarinPal reverse <=30 min; later = manual record).

## Incident quick answers
- 5xx spike: `/readyz` deps; pool exhaustion shows in readyz latency.
- OTP flood: per-mobile 3/h + per-IP 30/h caps active; inspect `rl:*` keys in Redis.
- Playback complaints: `media_assets.status='ready'` + `playback_sessions` rows (403 = no entitlement).
