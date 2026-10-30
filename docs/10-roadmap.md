# GoLearn — Implementation Roadmap (v1 Draft 1)

Each phase ends with a review gate: summary of changes, file list, trade-offs,
demo/verification steps. Sizes: S ≈ half day, M ≈ 1–2 days, L ≈ 3+ days (focus time).

| # | Phase | Deliverables | Exit criteria | Size |
|---|-------|--------------|---------------|------|
| 1 | **Discovery & design** (this) | docs/01–10 + openapi.yaml | owner approves | done |
| 2 | **Repo & platform foundation** | git init, monorepo scaffold, docker-compose (pg/redis/minio/caddy), golang-migrate + core migrations, sqlc setup, config/logger/health, CI skeleton, `.env.example`, seeds | `make dev` boots all services; `/healthz`+`/readyz` green; CI runs | M |
| 3 | **Identity: auth + RBAC** | register/login/OTP/refresh/logout/password flows, Argon2id, roles middleware, rate limits, audit log base, admin bootstrap user | authz matrix tests green; e2e journeys 1–2 | L |
| 4 | **Catalog & content domain** | courses/sections/lessons/categories CRUD (admin APIs), public read APIs, reviews model, blog/pages/testimonials/faqs CRUD, rich-text sanitization | draft→publish flow works; public APIs match OpenAPI; XSS sanitizer tests | L |
| 5 | **Media pipeline & playback** | storage adapter (MinIO), presigned uploads, asynq worker ingest, local VOD adapter + signed URLs, playback endpoint + authz, admin media grid | e2e journey 5; playback authz + rate-limit tests | L |
| 6 | **Commerce: orders, coupons, payments** | checkout, coupon engine, gateway registry, **ZarinPal adapter (official v4)** + sandbox, **DigiPay adapter (placeholder-marked)**, mock gateway app, callbacks, reconciliation worker, refunds | payment scenario matrix green (mock + ZarinPal sandbox); e2e journeys 3–4 | L |
| 7 | **Learner panel & player** | dashboard, my courses, hls.js player + resume/progress, orders/receipts, profile, contact | e2e journey 3 end-to-end incl. player UX | M |
| 8 | **Admin panel UI** | dashboard analytics, course/lesson editors, media manager, coupons, orders/refunds, users/roles, blog editor, settings, audit viewer, contact inbox | owner can run the full business from `/admin` | L |
| 9 | **Public site UI + SEO** | home/catalog/detail/about/contact/faq pages (M3 tokens + Apple motion), blog UI, metadata/JSON-LD/sitemap/robots/ISR revalidation, a11y pass | Lighthouse ≥ 90 targets; SEO checklist green | L |
| 10 | **Security hardening** | threat-model checklist execution, CSP/HSTS, session/OTP rate-limit tuning, IDOR re-audit, secret scanning, dependency scanning, pen-test checklist | docs/07 §5 signed off | M |
| 11 | **Testing completion & release prep** | full E2E suite, coverage gates, runbook, backup/restore drill, deploy notes, staging deploy | launch DoD (docs/01 §6) met | M |
| 12 | **Post-launch backlog** | SnappPay adapter (when docs arrive), ArvanCloud real VOD adapter, watermarking, concurrent-view monitoring, e-Namad/مودیان, email channel | prioritized with owner | — |

## External dependencies needed from owner (non-blocking, marked in code)

1. DigiPay merchant docs + credentials → fills `TODO(digipay-docs)`.
2. ArvanCloud (VOD) account + API docs → fills `TODO(arvan-docs)`.
3. SMS provider choice + API key → `sms` adapter config.
4. ZarinPal merchant panel: enable sandbox, set callback domain, whitelist server IP (for reverse).
5. Brand assets: logo, seed color, instructor photo/bio text.
6. Domain + DNS + hosting decision (docs/02 assumed provider-agnostic).
