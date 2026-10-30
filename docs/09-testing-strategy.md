# GoLearn — Testing Strategy (v1 Draft 1)

## 1. Pyramid & tooling

| Level | Scope | Tooling | Bar |
|-------|-------|---------|-----|
| Unit | domain logic: pricing/coupon math, OTP policy, token service, key/URL signing, slugs, format helpers | Go testing + testify, Vitest for TS libs | domain/services ≥ 80 % |
| Integration | repos (testcontainers Postgres/Redis), HTTP handlers (httptest + real router), adapters against MinIO/ZarinPal-sandbox-shaped mock server | testcontainers-go | payment + authz paths covered |
| E2E | full user journeys in browser | Playwright against compose stack (mock gateway + local VOD adapter) | 6 critical journeys green |
| Security | authz matrix, IDOR, rate limits, headers, sanitizer | Go integration suites + gitleaks/govulncheck/npm audit in CI | suite green = sign-off item |

## 2. Critical journeys (E2E, must stay green)

1. Register (OTP via mock SMS) → verify → dashboard visible.
2. Login with password → browse → course detail → preview lesson plays.
3. Checkout with coupon → mock gateway success → entitlement granted → lesson plays → progress persists.
4. Checkout → gateway cancel/fail → order stays payable → retry succeeds.
5. Admin: create course → upload fixture video (local VOD adapter) → publish → appears on site.
6. Admin: refund paid order → entitlement revoked → learner loses access.

## 3. Payment scenario matrix (integration, per adapter + mock)

| Scenario | Expected |
|----------|----------|
| Callback OK → verify code 100 | payment verified, order paid, entitlement granted once |
| Callback OK → verify code 101 (replay) | idempotent success, no double entitlement |
| Callback `Status=NOK` | no verify call, payment failed, order payable |
| Verify amount ≠ order total | rejected, audited, alert event |
| Callback with unknown/mismatched ref | 400, logged, no state change |
| Duplicate concurrent callbacks | one transition wins (conditional update), both 2xx-appropriate |
| Gateway timeout on initiate | payment stays initiated, user may retry (new attempt row) |
| Gateway timeout on verify | reconciliation job completes it later |
| Reverse within/without window | refund completed / falls to manual path |
| Coupon race (two concurrent checkouts, 1 use left) | exactly one succeeds (row lock) |

## 4. Authz & IDOR matrix (integration)

Roles {anon, learner, learner-entitled, instructor, admin, owner} × endpoints
{course draft GET, playback, progress PUT, orders GET/other-user, admin CRUD, refund,
role grant, settings PATCH, audit-logs}. Each cell asserted (2xx/403/404 as designed);
IDOR checks use two-learner fixtures. Includes **negative authorization**: object IDs
swapped between users must fail closed.

## 5. Contract & migration tests

- OpenAPI drift: handlers conform to `openapi.yaml` (generated types compiled in test server smoke).
- Migrations: up → seed → down → up in CI (testcontainers).
- Fixture videos: tiny synthetic HLS fixtures committed to test assets (no vendor).

## 6. CI pipeline (GitHub Actions)

```
backend:  gofmt/golangci-lint → go test -race (unit) → docker compose up deps → integration → coverage gate
frontend: eslint/tsc → vitest → next build
contract: openapi lint (spectral) → types generation compiles
security: gitleaks → govulncheck → npm audit (fail on high)
e2e:      compose full stack → playwright critical journeys (on main; nightly full)
```

PR gate = lint + unit + integration + security; e2e full suite nightly + pre-release.
