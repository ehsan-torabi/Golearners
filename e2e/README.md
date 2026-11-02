# GoLearn E2E suite

Playwright suite that drives the whole product in a real browser (Next.js frontend +
Go API + mock payment gateway) and writes a bug report an AI can work through.

## Run

```bash
./e2e/run.sh                      # boots the stack (api, worker, mock gateway, web) and runs everything
./e2e/run.sh specs/admin.spec.ts  # one spec file
cd e2e && bunx playwright test    # only the tests (stack must already be up)
./e2e/stop.sh                     # stop what run.sh started
```

The suite needs:

- the API on `:8080` logging to `/tmp/golearn-api.log` (the mock SMS provider prints the
  OTP code there — `run.sh` starts it that way),
- the frontend on `:3000`,
- the mock payment gateway on `:8082`,
- postgres/redis/minio (docker compose).

## Report

Every run writes:

| file | content |
|------|---------|
| `e2e/report/bugs.md` | the bug report: root causes, backend errors, one entry per failed test with expected/actual, evidence and the suspect file |
| `e2e/report/bugs.json` | same content, machine readable |
| `e2e/report/artifacts/` | screenshots, traces and the page snapshot of each failure |

## Coverage

| spec | area |
|------|------|
| `site.spec.ts` | home, course list + filters, course detail, blog list/post, instructor, contact form, 404, navbar, footer, theme toggle, robots/sitemap |
| `auth.spec.ts` | register + OTP, weak password, wrong password, password login, SMS login, logout, guest dashboard, session entry in the navbar |
| `checkout.spec.ts` | guest paywall, buy with the mock gateway, re-buy guard, cancelled payment + retry, coupon discount, empty checkout, re-login |
| `learner.spec.ts` | dashboard stats, course player + signed playback URL, progress saving, orders, profile, sidebar, password change |
| `admin.spec.ts` | overview, course create/curriculum/publish, media upload, blog post lifecycle, coupons, categories, users, contact inbox, refund, settings, audit log, learner lockout |
| `responsive.spec.ts` | mobile menu, RTL attributes, horizontal overflow (Pixel 7 project) |
| `smoke.spec.ts` | every public route renders with no 5xx and no client-side exception |

## Environment constraints the suite works around

- **Session length 15 min** — the suite logs in again when the cached token is about to
  expire instead of reusing a stale storage state.
- **Rate limits per IP** — register 10/h, OTP 30/h, contact 5/h, login 10/min. The specs
  skip (with a reason) when an endpoint is exhausted instead of failing.
- **Mock SMS** — OTP codes are read from the API log; the API must run with
  `APP_ENV=development`.
- **One worker** — the suite shares one database and the API throttles per IP.
