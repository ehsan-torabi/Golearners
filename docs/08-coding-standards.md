# GoLearn — Coding Standards (v1 Draft 1)

Principles: SOLID at the architecture level, DRY where it pays, **KISS wins ties**
(ponytail rule: the smallest change that fully solves the task — but never cut
validation, security, or error handling).

## 1. Layering rules (enforced by import checks)

```
domain      → imports stdlib only (pure logic, entities, errors)
service     → domain + ports (interfaces), never transport/repository types
repository  → implements ports; pgx/sqlc only here
adapter/*   → implements ports; vendor SDKs/HTTP only here
transport   → dto validation, calls services, no SQL
worker      → calls services
platform    → config/logger/db pool (leaf utilities)
```

- Dependencies point inward; `ports` is the seam. New external system = new adapter + port method, never a service-level HTTP call.
- DI by explicit constructor wiring in `cmd/*/main.go` (no magic).

## 2. Go

- Idiomatic Go: `context.Context` first param; errors wrapped with `%w` + domain sentinel errors (`var ErrOrderExpired = errors.New(...)`) or typed domain errors; **no panics** outside startup; `errors.Is/As` at the edge.
- Handlers: thin — validate DTO (go-playground/validator + custom rules), call service, map to JSON. Business rules never live in handlers.
- Money: `type Rial int64`; arithmetic in domain package; never `float`.
- Concurrency: asynq workers with idempotent handlers; DB transactions scoped and short; `SELECT … FOR UPDATE` for coupon/order transitions.
- SQL: parameterized statements only (pgx), hand-written repositories; sqlc codegen deferred until the query surface stabilizes; migrations up **and** down; no string-built SQL (lint-enforced).
- Logging: `slog` JSON; fields: `request_id, user_id, route, method, status, duration_ms`; sensitive values (tokens, OTP, passwords, card data) never logged; helper `logger.WithRequest(ctx)`.
- Config: single typed `Config` from env; validation at boot; no `os.Getenv` outside `platform/config`.
- Style: `gofmt`, `golangci-lint` (errcheck, govet, staticcheck, revive, gosec, gocritic, nonamedreturns, sqlclosecheck); table-driven tests; comments only for *why*.

## 3. TypeScript / Next.js

- `strict: true`; no `any` (eslint rule); generated API types from OpenAPI (single source).
- Server Components by default; `"use client"` only for interactivity (player, forms, charts); secrets/cookies never reach client bundles (only via server-fetched props/RSC).
- Forms: zod schemas co-located with components; server actions/route handlers re-validate (client validation is UX, not security).
- Styling: Tailwind v4 utilities + M3 tokens (`--md-sys-color-*` etc. in `tokens.css`); no raw hex in components; logical properties for RTL (`ms-`, `me-`, `text-start`); Vazirmatn via `next/font/local`; motion per apple-design/animate skills (transform/opacity, ≤ 300 ms, `prefers-reduced-motion`).
- Formatting helpers in `lib/format`: `toToman(rial)`, `faDigits(n)`, `jalali(date)` — one implementation, tested.
- File naming kebab-case; components PascalCase; one component per file.

## 4. API & data conventions

- Contract-first: change `docs/api/openapi.yaml` → regenerate TS types → implement; breaking changes need a version decision (v1 additive-only).
- Error envelope per docs/04; machine codes stable — Persian messages may change freely.
- Migrations: one concern per file; every destructive change has a documented data path; down migrations real (CI runs up→down→up).
- Seeds: dev-only fixtures (users w/ known Argon2id hashes, sample course with 2 preview lessons, mock-gateway-friendly order flow) — never run in prod.

## 5. Git & review

- Conventional commits (`feat(backend): …`, `fix(payments): …`); branches `feat/<phase>-<slug>`.
- Each phase lands as reviewable units; every PR: tests green, lint clean, `docs` updated when behavior changes.
- Definition of done (per PR): code + tests + docs touch + no new TODOs without issue refs; security-sensitive changes call out the threat-model row they address.

## 6. Documentation

- ADRs in `docs/adr/NNNN-title.md` for any decision reversing/altering docs/02 §4.
- `README.md` (root): quickstart, commands, env table; `deploy/RUNBOOK.md`: deploy, backup/restore, gateway panel config, incident steps.
