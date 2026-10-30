# GoLearn

Persian-first, RTL online course platform — Go API + Next.js (Bun) frontend.
Design docs: [`docs/`](docs/README.md) · Status: **Phase 2 — platform foundation**.

## Quickstart

Prerequisites: Go 1.27+, Docker (with compose), psql client (for seeds), sqlc (for codegen).

```bash
cp .env.example .env       # dev defaults; adjust if ports conflict
make infra                 # postgres + redis + minio (+bucket) + caddy
make migrate-up            # apply schema migrations
make seed                  # dev-only fixture data
make dev                   # run the Go API on :8080
```

Then:

- API liveness: `curl http://localhost:8080/healthz`
- Readiness (postgres/redis/storage checks): `curl -i http://localhost:8080/readyz`
- Via the dev proxy: `http://api.localhost/healthz` (Caddy on :80)

## Bootstrap the owner (admin) account

```bash
set -a; . ./.env; set +a
cd backend && go run ./cmd/bootstrap -mobile 09121234567 -password 'StrongPass123' -name 'استاد'
```

Idempotent — safe to re-run (updates the password and re-grants the owner role).

## Commands

| Command | Purpose |
|---------|---------|
| `make infra` | start dev infrastructure (docker compose) |
| `make dev` | run the Go API natively with `.env` loaded |
| `make migrate-up` / `migrate-down` / `migrate-status` | schema migrations (bundled runner) |
| `make seed` | dev-only fixtures |
| `make sqlc` | generate typed repositories from `backend/queries/*.sql` |
| `make build` / `make test` / `make fmt` | backend build, race-enabled tests, formatting |

## Layout

```
docs/       design & engineering documentation (start at docs/README.md)
backend/    Go API: cmd/{api,migrate}, internal/{platform,transport}, migrations, queries
deploy/     docker compose (dev infra) + Caddyfile
frontend/   Next.js app — added in the UI phases (docs/10)
```

## Environment

Every variable is documented in [`.env.example`](.env.example). Secrets never
enter git (`.env` is ignored; CI runs a secret scan from phase 3 on).

## Roadmap

Phase-by-phase plan with exit criteria: [`docs/10-roadmap.md`](docs/10-roadmap.md).
Current phase deliverables are listed in the docs and each phase lands as
reviewable git commits.
