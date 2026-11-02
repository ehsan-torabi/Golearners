# GoLearn E2E — findings & status

Result of the first full E2E pass over every app section (2026-11-02).
The suite lives in [`e2e/`](../README.md) — run it with `./e2e/run.sh`.

## Current status

| metric | value |
|--------|-------|
| tests | 67 (desktop + mobile projects) |
| last full run | **65 passed · 2 skipped · 0 failed** |
| skipped | register+OTP and one more — skipped by design when register/OTP/contact are rate-limited (10/h, 30/h, 5/h per IP) |

## Bugs the suite surfaced (all fixed)

| # | severity | symptom the test caught | root cause | fix |
|---|----------|-------------------------|-----------|-----|
| 1 | critical | buyer pays, callback 500s, no access ever granted | `EntitlementRepo.Grant` mixed `nullif($5,'0001-01-01')` text inference with `now()` → PostgreSQL 42804 | explicit `::timestamptz` casts (`backend/internal/repository/review.go`) |
| 2 | major | hydration error on every page with a breadcrumb | `SiteBreadcrumb` nested the separator `<li>` inside the item `<li>` | separator moved out of the item (`frontend/components/site-breadcrumb.tsx`) |
| 3 | major | admin table pages broke hydration | farsiui `Table` (div-based) wrapped in a native `<table>` | wrapper removed in the admin list pages |
| 4 | major | image/PDF uploads could never register (400) | storage-key extension derived from a random map iteration (`master.jpg` for a PNG) | one canonical mime per kind (`cfaf214`) |
| 5 | major | closing a contact message 500s | UI sends status `closed`, DB enum only had new/read/replied | migration `000008_contact_status_closed` + handler validation |
| 6 | major | published posts still showed as drafts in the admin list | `postJSON` did not carry `status` | status added to the DTO (`850ee41`) |
| 7 | major | admin coupon list rendered empty rows | coupon DTO serialized Go-style keys (`ID`,`Code`) while the console expects snake_case | json tags on the domain struct |
| 8 | major | admin course search found nothing by slug | search SQL matched only title/summary while the UI promises "عنوان یا نامک دوره" | `c.slug ILIKE` added (`backend/internal/repository/course.go`) |

Fixes for 1, 2, 3, 8 and the DTO/enum work landed in `850ee41`
("fix(admin+checkout): make the admin console and the purchase flow work").

## Open issues (for the next pass)

1. **Duplicate coupon code answers 500 instead of 409** —
   `POST /api/v1/admin/coupons` with an existing code logs
   `insert coupon: ERROR: duplicate key value violates unique constraint "coupons_code_key"`
   and returns INTERNAL_ERROR. Repro: create code `X` twice.
   Suggested fix: pre-check `ByCode` (the repo already has it) and return
   `apperr.ErrConflict` with a Persian message; the console should surface it
   next to the code field.
2. **Every public page logs a 401 console error for guests** — the navbar's
   `useSession` calls `GET /api/v1/me`, which answers 401 for anonymous
   visitors. Harmless but it paints the browser console red on every page and
   shows up in the suite's diagnostics. Suggested fix: answer 200 with
   `{ authenticated: false }` (or a distinct `SESSION_ANONYMOUS` code) so the
   session probe is not an error.
3. **Dev rate limits vs repeatable E2E** — register 10/h, OTP 30/h, contact 5/h
   per IP. The suite skips (with a reason) when an endpoint is exhausted; for
   unattended runs clear the counters first:
   `docker compose exec redis redis-cli --scan --pattern 'rl:*' | xargs docker compose exec redis redis-cli del`
   (`e2e/run.sh` already does this).
4. **Two Next dev servers must not share one `distDir`** — running a second dev
   server against the same `frontend/.next` corrupts the build
   (`Cannot find module './NNNN.js'`, HTTP 500 on every page). Use
   `NEXT_DIST_DIR=.next-e2e PORT=3100` for the test instance (the suite's
   `run.sh` reuses an already-running server instead).

## Environment notes

- The Playwright browser download is geo-blocked on this network — install with
  `HTTPS_PROXY=http://127.0.0.1:10808 bunx playwright install chromium`.
- OTP codes are read from the API log (`/tmp/golearn-api.log`); the API must run
  with `APP_ENV=development` so the mock SMS provider logs them.
- Sessions last 15 minutes; the suite re-logins when the cached token is about
  to expire instead of replaying a stale storage state.
