# GoLearn — Threat Model (v1 Draft 1)

Method: STRIDE over the main flows. Assets first, then per-boundary analysis,
mitigations mapped to docs (SRS FRs, testing strategy). Reviewed again at the
security-hardening phase (roadmap P10).

## 1. Assets & adversaries

**Assets** (impact-ordered): payment integrity (amounts, entitlements) · video
content (revenue) · user credentials/PII (mobile, password hashes) · admin accounts ·
gateway credentials & signing keys · site availability/SEO reputation.

**Adversaries**: opportunistic attackers & bots (credential stuffing, scraping,
OTP abuse) · pirates (token sharing, download tools, recorders — mitigations raise
cost, can't eliminate) · fraudulent buyers (chargeback-style abuse is low with IPG,
coupon abuse is real) · compromised learner accounts · malicious insider admin
(audit log + owner-only role grants) · upstream provider compromise (limited blast
radius, keys scoped).

## 2. Trust boundaries

```
[Internet] —(TLS)— [Caddy] —(http)— [Next.js SSR] (public content, no secrets)
[Browser JS] —(cookie+CSRF)— [Go API] —(mTLS-less TLS + creds)— [Postgres/Redis/S3/VOD/SMS/Gateway]
[Gateway redirect] —(unauthenticated callback)— [Go API] (verified server-side)
[VOD signed URL] —(short token)— [Player]
```

## 3. STRIDE per surface

| Surface | Threat | Mitigation | Verified by |
|---------|--------|------------|-------------|
| Registration/OTP (S,S,R) | SMS bombing, OTP brute force, enumeration | per-mobile + per-IP rate limits (3/h request, 60 s resend), 6-digit 2-min TTL, 5 attempts, hashed codes, purpose-scoped, generic responses (no account-existence leak), SMS cost alert | unit + integration rate-limit tests |
| Login (S) | Credential stuffing, lockout abuse | Argon2id, per-IP+per-account throttling with backoff, generic errors, audit anomalies | authz matrix tests |
| Session (S,T) | Token theft, fixation, CSRF | httpOnly+Secure+SameSite=Lax cookies, 15-min access TTL, rotating refresh with **reuse detection → family revocation**, CSRF double-submit on mutations, no tokens in URLs/logs | integration: rotation/replay tests |
| Checkout/payment (T,R,E,I) | Price tampering, coupon race, callback forgery, replay, amount mismatch | server-side price snapshot; coupon decrement in TX with row lock; callbacks verified via gateway API (never query params alone); verify idempotent (ZarinPal 101 = success); amount equality re-checked; `payment_events` append-only ledger; NOK ⇒ no verify | payment scenario matrix (docs/09 §3) |
| Reconciliation (R) | Silent money loss | worker inquires stuck payments; every transition evented; admin alerts on unknown | worker integration tests |
| Refunds (S,E) | Unauthorized refund, double refund | admin-only + audit; gateway reverse bounded (ZarinPal ≤ 30 min); refund row unique per payment; entitlement revocation idempotent | integration tests |
| Playback (I,R) | URL sharing, token replay, leeching | entitlement check per issuance; TTL ≤ 5 min; optional IP bind; issuance rate limits; playback_sessions audit; anomaly alert | playback authz + rate-limit tests |
| Media pipeline (T,I) | Malicious upload, path traversal, storage creds leak | admin-only presign, MIME/extension allowlist, size caps, server-generated UUID keys, no list perms, creds env-only | unit (key gen) + upload integration |
| Admin panel (S,E,I) | Privilege escalation, destructive action without trace | server-side RBAC on every route (not UI-only), owner-only role grants, audit log in same TX, CSRF, (P2 TOTP for admins) | authz matrix + audit tests |
| Blog/pages (X,I) | Stored XSS via rich text | server-side HTML sanitize allowlist (Go: bluemonday) before persist; CSP; React escaping | sanitizer unit tests + CSP header test |
| SQL/inputs (T,I) | SQLi, mass assignment | sqlc parameterized only; DTO whitelists; validator on every input | lint rule: no raw fmt.Sprintf SQL |
| Public API abuse (R,D) | Scraping, DoS-lite | rate limits per route class, pagination caps, caching/ISR, Caddy-level limits | load smoke in CI (optional) |
| Secrets/ops (I) | Leaked keys, weak backups | `.env` never committed (gitleaks in CI), least-privilege DB user, nightly encrypted pg_dump + storage snapshot, restore drill in runbook | CI secret scan; runbook drill |
| Transport (S,T,I) | MITM, clickjacking, MIME sniffing | HSTS, TLS-only, CSP (frame-ancestors 'none'), X-Content-Type-Options, Referrer-Policy: strict-origin-when-cross-origin | header integration test |

## 4. Abuse cases & responses

- **"Buy 1, share with 100"**: concurrent-view cap per entitlement (P2), playback anomaly alerts; balance vs UX — start with monitoring only.
- **Coupon brute force**: codes normalized + rate-limited (10/h/user), invalid attempts audited.
- **OTP→account takeover**: reset OTP revokes all sessions; SIM-swap residual risk accepted (documented).
- **Payment callback DoS**: cheap reject path (no DB write) for unmatched refs; rate limit per IP.
- **Insider admin misuse**: audit every mutation; owner-only for role grants and settings.gateway toggles.

## 5. Sign-off checklist (for hardening phase)

gitleaks clean · deps scanned (govulncheck, npm audit) · CSP/HSTS verified ·
authz matrix green · IDOR suite green (orders, playback, progress, admin ids) ·
payment negative-path suite green · backup restore drilled · generic error audit ·
PII-in-logs audit · sandbox creds rotated before go-live.
