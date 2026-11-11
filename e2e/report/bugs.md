# GoLearn — E2E bug report

Generated 2026-11-11T23:17:48.269Z · 308s · 71 passed · 43 failed · 6 skipped · 0 flaky (76 total)

Reproduce a single entry with `cd e2e && bunx playwright test <spec file>`.

## Root causes (grouped)

| # | Failures | Signature |
|---|----------|-----------|
| 1 | 8 (BUG-003, BUG-004, BUG-010, BUG-021, BUG-025, BUG-032, BUG-033, BUG-034) | Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed |
| 2 | 8 (BUG-035, BUG-036, BUG-037, BUG-038, BUG-039, BUG-040, BUG-041, BUG-042) | Failed to load resource: the server responded with a status of 404 (Not Found) |
| 3 | 4 (BUG-009, BUG-019, BUG-022, BUG-023) | Failed to load resource: the server responded with a status of 401 (Unauthorized) |
| 4 | 4 (BUG-015, BUG-016, BUG-017, BUG-018) | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login |
| 5 | 2 (BUG-011, BUG-024) | Failed to load resource: the server responded with a status of 500 (Internal Server Error) |
| 6 | 2 (BUG-012, BUG-020) | Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts |
| 7 | 2 (BUG-013, BUG-014) | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/register |
| 8 | 2 (BUG-026, BUG-027) | TimeoutError: locator.click: Timeout 20000ms exceeded. |
| 9 | 2 (BUG-028, BUG-031) | Failed to load resource: the server responded with a status of 400 (Bad Request) |
| 10 | 2 (BUG-029, BUG-030) | TypeError: Cannot read properties of undefined (reading 'unicode') |
| 11 | 1 (BUG-001) | Failed to load resource: net::ERR_CONNECTION_REFUSED |
| 12 | 1 (BUG-002) | Error: login as admin failed: 0 AggregateError: apiRequestContext.post: connect ECONNREFUSED ::1:8080 |
| 13 | 1 (BUG-005) | AggregateError: apiRequestContext.get: connect ECONNREFUSED ::1:8080 |
| 14 | 1 (BUG-006) | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/ |
| 15 | 1 (BUG-007) | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/courses |
| 16 | 1 (BUG-008) | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/courses?q=Go |
| 17 | 1 (BUG-043) | Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenera |

## Index

| ID | Severity | Area | Title |
|----|----------|------|-------|
| BUG-001 | major | admin console | a course is created, gets a curriculum, is published and shows up on the site |
| BUG-002 | major | admin console | the course list can be searched by slug |
| BUG-003 | major | admin console | the cover image is uploaded through the media field |
| BUG-004 | major | learner dashboard | the profile page shows the account information |
| BUG-005 | major | learner dashboard | the sidebar reaches every learner section |
| BUG-006 | major | public site | home page renders hero, course sections and FAQ |
| BUG-007 | major | public site | courses list shows cards that lead to a detail page |
| BUG-008 | major | public site | course search finds the known course |
| BUG-009 | major | public site | course detail shows curriculum and a guest purchase CTA |
| BUG-010 | major | admin console | the cover image is uploaded, applied and shown on the public course |
| BUG-011 | critical | admin console | a blog post is written, published, visible on the blog and deletable |
| BUG-012 | major | learner dashboard | the orders page lists a paid order |
| BUG-013 | major | authentication | a new mobile registers, verifies the OTP and lands on the dashboard |
| BUG-014 | major | authentication | registration rejects a password that is too short |
| BUG-015 | major | authentication | login with a wrong password shows an error and stays on the login page |
| BUG-016 | major | authentication | login with the correct password opens the learner dashboard |
| BUG-017 | major | authentication | login with an SMS code opens the learner dashboard |
| BUG-018 | major | authentication | logout clears the session and returns to the login page |
| BUG-019 | major | authentication | the dashboard sends anonymous visitors to the login page |
| BUG-020 | major | admin console | a course category can be created |
| BUG-021 | major | admin console | a learner cannot open the admin console |
| BUG-022 | major | route smoke test | /blog renders without errors |
| BUG-023 | major | route smoke test | / renders without errors |
| BUG-024 | critical | admin console | an admin can block and unblock a user |
| BUG-025 | major | admin console | a coupon is created and switched off |
| BUG-026 | major | admin console | a contact message reaches the admin inbox and can be closed |
| BUG-027 | major | admin console | a paid order can be refunded from the admin console |
| BUG-028 | major | cart.spec.ts | the cart collects courses, removes one, and pays the rest in one order |
| BUG-029 | major | cart.spec.ts | a failed payment is resumable from the orders list without a second order |
| BUG-030 | major | cart.spec.ts | a guest cart asks for sign-in only at pay time |
| BUG-031 | major | checkout & payment | a coupon lowers the payable amount |
| BUG-032 | major | admin-stats.spec.ts | a course opens its own statistics page |
| BUG-033 | major | admin-stats.spec.ts | the course page lists its learners and filters them |
| BUG-034 | major | admin-stats.spec.ts | the course editor links to the statistics page |
| BUG-035 | major | cart.spec.ts | an empty cart sends the visitor to the courses |
| BUG-036 | major | cart.spec.ts | a guest cart asks for sign-in only at pay time |
| BUG-037 | major | checkout & payment | a guest is asked to sign in before paying |
| BUG-038 | major | checkout & payment | the learner buys a course with the mock gateway and gets access |
| BUG-039 | major | checkout & payment | buying the same course twice is refused |
| BUG-040 | major | checkout & payment | a cancelled payment keeps the order payable and a retry succeeds |
| BUG-041 | major | checkout & payment | checkout without a course shows the empty state |
| BUG-042 | major | checkout & payment | the learner can sign in again after the session is lost |
| BUG-043 | major | admin console | a blog post is written, published, visible on the blog and deletable |

## BUG-001 · a course is created, gets a curriculum, is published and shows up on the site

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:29 ›  › desktop › admin.spec.ts › admin console › a course is created, gets a curriculum, is published and shows up on the site`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "دورهٔ مدیریت تست mvzw16l686"
  - Fill "e2e-admin-mvzw16l620"
  - Select option
  - Fill "25000"
  - Fill "خلاصهٔ دورهٔ ساخته‌شده توسط تست خودکار."
  - Click
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('ذخیره شد')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByText('ذخیره شد') with timeout 15000ms[22m
[2m  - waiting for getByText('ذخیره شد')[22m

```

**Console errors**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
WebSocket connection to 'ws://localhost:3000/_next/webpack-hmr' failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

**Failed requests**
```
GET http://localhost:3000/api/v1/categories :: net::ERR_CONNECTION_REFUSED
POST http://localhost:3000/api/v1/admin/courses :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-a-cour-1bea5-ed-and-shows-up-on-the-site-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-a-cour-1bea5-ed-and-shows-up-on-the-site-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-a-cour-1bea5-ed-and-shows-up-on-the-site-desktop/trace.zip`)

## BUG-002 · the course list can be searched by slug

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:86 ›  › desktop › admin.spec.ts › admin console › the course list can be searched by slug`
- **Steps:**
  - Before Hooks
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: login as admin failed: 0 AggregateError: apiRequestContext.post: connect ECONNREFUSED ::1:8080
- **Suspect area:** `route /api/v1/auth/login[22m (frontend/app/api/v1/auth/login[22m/page.tsx or its client component)`, `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: login as admin failed: 0 AggregateError: apiRequestContext.post: connect ECONNREFUSED ::1:8080
connect ECONNREFUSED 127.0.0.1:8080
Call log:
[2m  - → POST http://localhost:8080/api/v1/auth/login[22m
[2m    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.8078.4 Safari/537.36[22m
[2m    - accept: */*[22m
[2m    - accept-encoding: gzip,deflate,br[22m
[2m    - content-type: application/json[22m
[2m    - content-length: 50[22m

```

**Trace:** `report/artifacts/desktop/admin-admin-console-the-course-list-can-be-searched-by-slug-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-the-course-list-can-be-searched-by-slug-desktop/trace.zip`)

## BUG-003 · the cover image is uploaded through the media field

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:105 ›  › desktop › admin.spec.ts › admin console › the cover image is uploaded through the media field`
- **Steps:**
  - Before Hooks
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Fill "دورهٔ کاور تست mvzw1yo251"
  - Click
  - Click
  - Click
  - Set input files
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('فایل بارگذاری شد و در حال پردازش است.')
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByText('فایل بارگذاری شد و در حال پردازش است.') with timeout 30000ms[22m
[2m  - waiting for getByText('فایل بارگذاری شد و در حال پردازش است.')[22m

```

**Failed requests**
```
PUT http://localhost:9000/golearn-media/media/image/2026/11/01a19e96-9f50-77da-9e01-3c6b02f89c3c/sample.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T232713Z&X-Amz-Expires=600&X-Amz-SignedHeaders=content-type%3Bhost&x-id=PutObject&X-Amz-Signature=da47a8f41f46db5694e25461687b16a2440aee139819d1cc79396d66cecddb81 :: net::ERR_ABORTED
```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-the-co-93497-ded-through-the-media-field-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-the-co-93497-ded-through-the-media-field-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-the-co-93497-ded-through-the-media-field-desktop/trace.zip`)

## BUG-004 · the profile page shows the account information

- **Severity:** major
- **Area:** learner dashboard
- **Test:** `specs/learner.spec.ts:161 ›  › desktop › learner.spec.ts › learner dashboard › the profile page shows the account information`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/dashboard/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: 'اطلاعات حساب' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByRole('heading', { name: 'اطلاعات حساب' }) with timeout 15000ms[22m
[2m  - waiting for getByRole('heading', { name: 'اطلاعات حساب' })[22m

```

**Screenshot:** `report/artifacts/desktop/learner-learner-dashboard--50088-ows-the-account-information-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/learner-learner-dashboard--50088-ows-the-account-information-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/learner-learner-dashboard--50088-ows-the-account-information-desktop/trace.zip`)

## BUG-005 · the sidebar reaches every learner section

- **Severity:** major
- **Area:** learner dashboard
- **Test:** `specs/learner.spec.ts:173 ›  › desktop › learner.spec.ts › learner dashboard › the sidebar reaches every learner section`
- **Steps:**
  - Before Hooks
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** AggregateError: apiRequestContext.get: connect ECONNREFUSED ::1:8080
- **Suspect area:** `route /api/v1/admin/media?per_page=100[22m (frontend/app/api/v1/admin/media?per_page=100[22m/page.tsx or its client component)`, `frontend/app/(app)/dashboard/**`

```
AggregateError: apiRequestContext.get: connect ECONNREFUSED ::1:8080
connect ECONNREFUSED 127.0.0.1:8080
Call log:
[2m  - → GET http://localhost:8080/api/v1/admin/media?per_page=100[22m
[2m    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.8078.4 Safari/537.36[22m
[2m    - accept: */*[22m
[2m    - accept-encoding: gzip,deflate,br[22m
[2m    - X-CSRF-Token: a868d79421948a2237fa744350bfef69d77efde503be1ae2cdad5fa766fceaad[22m
[2m    - Cookie: gl_at=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnb2xlYXJuIiwic3ViIjoiMDFhMTkwMGMtMTAyYi03OTYyLThiNzctOGUyMzI0YTcxYjhkIiwiZXhwIjoxNzkzNjYzMDk5LCJpYXQiOjE3OTM2NjIxOTksImp0aSI6IjU0ZmNlYmQ1LTM2ZGUtNGZkYS1hMzMyLWY0ZWExNDkyMmU1MyJ9.sn1XQ0fh4xamUM5B8As3ueZjJ-pz7-0uiAZUy5f4cCk; gl_rt=E3wfGVI9S1pplKUvl6riuz8hCWY9T-dKRrZYLn_s8rc; gl_csrf=a868d79421948a2237fa744350bfef69d77efde503be1ae2cdad5fa766fceaad[22m

```

**Trace:** `report/artifacts/desktop/learner-learner-dashboard--300e6-aches-every-learner-section-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/learner-learner-dashboard--300e6-aches-every-learner-section-desktop/trace.zip`)

## BUG-006 · home page renders hero, course sections and FAQ

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:4 ›  › desktop › site.spec.ts › public site › home page renders hero, course sections and FAQ`
- **Steps:**
  - Before Hooks
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
- **Suspect area:** `route / (frontend/app//page.tsx or its client component)`, `frontend/app/(site)/**`

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
[2m  - navigating to "http://localhost:3000/", waiting until "load"[22m

```

**Failed requests**
```
GET http://localhost:3000/ :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/site-public-site-home-page-7bbc0-ero-course-sections-and-FAQ-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/site-public-site-home-page-7bbc0-ero-course-sections-and-FAQ-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/site-public-site-home-page-7bbc0-ero-course-sections-and-FAQ-desktop/trace.zip`)

## BUG-007 · courses list shows cards that lead to a detail page

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:23 ›  › desktop › site.spec.ts › public site › courses list shows cards that lead to a detail page`
- **Steps:**
  - Before Hooks
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/courses
- **Suspect area:** `route /courses (frontend/app/courses/page.tsx or its client component)`, `frontend/app/(site)/**`

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/courses
Call log:
[2m  - navigating to "http://localhost:3000/courses", waiting until "load"[22m

```

**Failed requests**
```
GET http://localhost:3000/courses :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/site-public-site-courses-l-93a01--that-lead-to-a-detail-page-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/site-public-site-courses-l-93a01--that-lead-to-a-detail-page-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/site-public-site-courses-l-93a01--that-lead-to-a-detail-page-desktop/trace.zip`)

## BUG-008 · course search finds the known course

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:36 ›  › desktop › site.spec.ts › public site › course search finds the known course`
- **Steps:**
  - Before Hooks
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/courses?q=Go
- **Suspect area:** `route /courses?q=Go (frontend/app/courses?q=Go/page.tsx or its client component)`, `frontend/app/(site)/**`

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/courses?q=Go
Call log:
[2m  - navigating to "http://localhost:3000/courses?q=Go", waiting until "load"[22m

```

**Failed requests**
```
GET http://localhost:3000/courses?q=Go :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/site-public-site-course-search-finds-the-known-course-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/site-public-site-course-search-finds-the-known-course-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/site-public-site-course-search-finds-the-known-course-desktop/trace.zip`)

## BUG-009 · course detail shows curriculum and a guest purchase CTA

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:48 ›  › desktop › site.spec.ts › public site › course detail shows curriculum and a guest purchase CTA`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - client/server errors:

  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-8/traces/5c02723ad68c2a0d50c5-c3ae585d7899315432f4.network'
- **Suspect area:** `frontend/app/(site)/**`

```
Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-8/traces/5c02723ad68c2a0d50c5-c3ae585d7899315432f4.network'
```

**Console errors**
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

**Screenshot:** `report/artifacts/desktop/site-public-site-course-de-5fd91-um-and-a-guest-purchase-CTA-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/site-public-site-course-de-5fd91-um-and-a-guest-purchase-CTA-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/site-public-site-course-de-5fd91-um-and-a-guest-purchase-CTA-desktop/trace.zip`)

## BUG-010 · the cover image is uploaded, applied and shown on the public course

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:105 ›  › desktop › admin.spec.ts › admin console › the cover image is uploaded, applied and shown on the public course`
- **Steps:**
  - Before Hooks
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Fill "دورهٔ کاور تست mvzwp6wf38"
  - Click
  - Click
  - Click
  - Set input files
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: locator('#c-cover option').filter({ hasText: 'sample.png' })
Expected: visible
Error: strict mode violation: locator('#c-cover option').filter({ hasText: 'sample.png' }) resolved to 6 elements:
    1) <option value="01a19ea7-1072-7e93-91f2-3b80f59ba7ad">sample.png · آماده</option> aka getByLabel('تصویر کاور', { exact: true })
    2) <option value="01a19ea1-59aa-7b3f-82f6-c2e4c8b631fe">sample.png · آماده</option> aka getByLabel('تصویر کاور', { exact: true })
    3) <option value="01a19e99-f114-7b3d-9330-be218b4ab660">sample.png · آماده</option> aka getByLabel('تصویر کاور', { exact: true })
    4) <option value="01a19e96-9f75-7e88-8679-cdfa78e9d965">sample.png · آماده</option> aka getByLabel('تصویر کاور', { exact: true })
    5) <option value="01a19e90-83c5-722c-9c6c-f93497aa54b8">sample.png · آماده</option> aka getByLabel('تصویر کاور', { exact: true })
    6) <option value="01a19e8f-fe39-7cef-b228-38f30e93bb39">sample.png · آماده</option> aka getByLabel('تصویر کاور', { exact: true })

Call log:
[2m  - Expect "toBeVisible" locator('#c-cover option').filter({ hasText: 'sample.png' }) with timeout 15000ms[22m
[2m  - waiting for locator('#c-cover option').filter({ hasText: 'sample.png' })[22m

```

**Failed requests**
```
PUT http://localhost:9000/golearn-media/media/image/2026/11/01a19ea7-1048-728b-b5fa-bf5c2ab20de7/sample.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T234511Z&X-Amz-Expires=600&X-Amz-SignedHeaders=content-type%3Bhost&x-id=PutObject&X-Amz-Signature=b1e6a7f8991e3c205675dfa4bae8f8973b3d3799802a7935c5f7b8ec21277a0d :: net::ERR_ABORTED
```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-the-co-94f67--shown-on-the-public-course-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-the-co-94f67--shown-on-the-public-course-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-the-co-94f67--shown-on-the-public-course-desktop/trace.zip`)

## BUG-011 · a blog post is written, published, visible on the blog and deletable

- **Severity:** critical
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:159 ›  › desktop › admin.spec.ts › admin console › a blog post is written, published, visible on the blog and deletable`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "نوشتهٔ تست E2E mw0dli8j61"
  - Fill "e2e-post-mw0dli8j35"
  - Fill "خلاصهٔ نوشتهٔ تست خودکار."
  - Click
  - Set input files
  - Expect "toBeVisible"
  - Expect "toHaveText"
  - Click
  - Click
  - Type "متن نوشتهٔ تست خودکار."
  - Click
  - Expect "toBeVisible"
  - Navigate
  - Fill "نوشتهٔ تست E2E mw0dli8j61"
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: locator.fill: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
TimeoutError: locator.fill: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for locator('#post-q')[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**HTTP 5xx**
```
500 GET http://localhost:3000/api/v1/admin/posts?status=archived&page=1&per_page=1
```

**Failed requests**
```
PUT http://localhost:9000/golearn-media/media/image/2026/11/01a1a058-29f8-7c88-b1d9-c905e6dbad02/sample.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20261103%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261103T073814Z&X-Amz-Expires=600&X-Amz-SignedHeaders=content-type%3Bhost&x-id=PutObject&X-Amz-Signature=0c1a32afb4ee1f467e03866686b0dc949e66331ffe069906b805347fdb6c02e2 :: net::ERR_ABORTED
GET http://localhost:3000/admin/posts?_rsc=I96lpCdFwB155B-C :: net::ERR_ABORTED
```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-a-blog-06728-e-on-the-blog-and-deletable-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-a-blog-06728-e-on-the-blog-and-deletable-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-a-blog-06728-e-on-the-blog-and-deletable-desktop/trace.zip`)

## BUG-012 · the orders page lists a paid order

- **Severity:** major
- **Area:** learner dashboard
- **Test:** `specs/learner.spec.ts:146 ›  › desktop › learner.spec.ts › learner dashboard › the orders page lists a paid order`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - Click
  - Wait for navigation
  - Click
  - Wait for load state "load"
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - client/server errors:

  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-1/traces/1cf27305d23daeafd3db-96499bde761c2ffac337-recording66.network'
- **Suspect area:** `frontend/app/(app)/dashboard/**`

```
Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-1/traces/1cf27305d23daeafd3db-96499bde761c2ffac337-recording66.network'
```

**Screenshot:** `report/artifacts/desktop/learner-learner-dashboard-the-orders-page-lists-a-paid-order-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/learner-learner-dashboard-the-orders-page-lists-a-paid-order-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/learner-learner-dashboard-the-orders-page-lists-a-paid-order-desktop/trace.zip`)

## BUG-013 · a new mobile registers, verifies the OTP and lands on the dashboard

- **Severity:** major
- **Area:** authentication
- **Test:** `specs/auth.spec.ts:13 ›  › desktop › auth.spec.ts › authentication › a new mobile registers, verifies the OTP and lands on the dashboard`
- **Steps:**
  - Before Hooks
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/register
- **Suspect area:** `route /register (frontend/app/register/page.tsx or its client component)`, `frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go`

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/register
Call log:
[2m  - navigating to "http://localhost:3000/register", waiting until "load"[22m

```

**Failed requests**
```
GET http://localhost:3000/register :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/auth-authentication-a-new--1c840--and-lands-on-the-dashboard-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/auth-authentication-a-new--1c840--and-lands-on-the-dashboard-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/auth-authentication-a-new--1c840--and-lands-on-the-dashboard-desktop/trace.zip`)

## BUG-014 · registration rejects a password that is too short

- **Severity:** major
- **Area:** authentication
- **Test:** `specs/auth.spec.ts:39 ›  › desktop › auth.spec.ts › authentication › registration rejects a password that is too short`
- **Steps:**
  - Before Hooks
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/register
- **Suspect area:** `route /register (frontend/app/register/page.tsx or its client component)`, `frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go`

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/register
Call log:
[2m  - navigating to "http://localhost:3000/register", waiting until "load"[22m

```

**Failed requests**
```
GET http://localhost:3000/register :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/auth-authentication-regist-737df--password-that-is-too-short-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/auth-authentication-regist-737df--password-that-is-too-short-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/auth-authentication-regist-737df--password-that-is-too-short-desktop/trace.zip`)

## BUG-015 · login with a wrong password shows an error and stays on the login page

- **Severity:** major
- **Area:** authentication
- **Test:** `specs/auth.spec.ts:52 ›  › desktop › auth.spec.ts › authentication › login with a wrong password shows an error and stays on the login page`
- **Steps:**
  - Before Hooks
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
- **Suspect area:** `route /login (frontend/app/login/page.tsx or its client component)`, `frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go`

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
[2m  - navigating to "http://localhost:3000/login", waiting until "load"[22m

```

**Failed requests**
```
GET http://localhost:3000/login :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/auth-authentication-login--7af25-and-stays-on-the-login-page-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/auth-authentication-login--7af25-and-stays-on-the-login-page-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/auth-authentication-login--7af25-and-stays-on-the-login-page-desktop/trace.zip`)

## BUG-016 · login with the correct password opens the learner dashboard

- **Severity:** major
- **Area:** authentication
- **Test:** `specs/auth.spec.ts:67 ›  › desktop › auth.spec.ts › authentication › login with the correct password opens the learner dashboard`
- **Steps:**
  - Before Hooks
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
- **Suspect area:** `route /login (frontend/app/login/page.tsx or its client component)`, `frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go`

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
[2m  - navigating to "http://localhost:3000/login", waiting until "load"[22m

```

**Failed requests**
```
GET http://localhost:3000/login :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/auth-authentication-login--6404d-opens-the-learner-dashboard-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/auth-authentication-login--6404d-opens-the-learner-dashboard-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/auth-authentication-login--6404d-opens-the-learner-dashboard-desktop/trace.zip`)

## BUG-017 · login with an SMS code opens the learner dashboard

- **Severity:** major
- **Area:** authentication
- **Test:** `specs/auth.spec.ts:75 ›  › desktop › auth.spec.ts › authentication › login with an SMS code opens the learner dashboard`
- **Steps:**
  - Before Hooks
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
- **Suspect area:** `route /login (frontend/app/login/page.tsx or its client component)`, `frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go`

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
[2m  - navigating to "http://localhost:3000/login", waiting until "load"[22m

```

**Failed requests**
```
GET http://localhost:3000/login :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/auth-authentication-login--d548d-opens-the-learner-dashboard-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/auth-authentication-login--d548d-opens-the-learner-dashboard-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/auth-authentication-login--d548d-opens-the-learner-dashboard-desktop/trace.zip`)

## BUG-018 · logout clears the session and returns to the login page

- **Severity:** major
- **Area:** authentication
- **Test:** `specs/auth.spec.ts:97 ›  › desktop › auth.spec.ts › authentication › logout clears the session and returns to the login page`
- **Steps:**
  - Before Hooks
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
- **Suspect area:** `route /login (frontend/app/login/page.tsx or its client component)`, `frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go`

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/login
Call log:
[2m  - navigating to "http://localhost:3000/login", waiting until "load"[22m

```

**Failed requests**
```
GET http://localhost:3000/login :: net::ERR_CONNECTION_REFUSED
```

**Screenshot:** `report/artifacts/desktop/auth-authentication-logout-bf2dd-d-returns-to-the-login-page-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/auth-authentication-logout-bf2dd-d-returns-to-the-login-page-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/auth-authentication-logout-bf2dd-d-returns-to-the-login-page-desktop/trace.zip`)

## BUG-019 · the dashboard sends anonymous visitors to the login page

- **Severity:** major
- **Area:** authentication
- **Test:** `specs/auth.spec.ts:112 ›  › desktop › auth.spec.ts › authentication › the dashboard sends anonymous visitors to the login page`
- **Steps:**
  - Before Hooks
  - Navigate
  - Wait for load state "load"
  - Expect "toBeVisible"
  - Expect "toHaveURL"
  - client/server errors:

  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-6/traces/d748ac400d08b85935ef-c5aac51f3b65aad3ee1a.network'
- **Suspect area:** `frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go`

```
Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-6/traces/d748ac400d08b85935ef-c5aac51f3b65aad3ee1a.network'
```

**Console errors**
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

**Screenshot:** `report/artifacts/desktop/auth-authentication-the-da-0bdfb--visitors-to-the-login-page-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/auth-authentication-the-da-0bdfb--visitors-to-the-login-page-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/auth-authentication-the-da-0bdfb--visitors-to-the-login-page-desktop/trace.zip`)

## BUG-020 · a course category can be created

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:231 ›  › desktop › admin.spec.ts › admin console › a course category can be created`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "دستهٔ تست mw0ag2ci98"
  - Click
  - Expect "toBeVisible"
  - client/server errors:

  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-0/traces/d4043a9dd1ab94463227-4c469cb957666757a122-recording15.trace'
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-0/traces/d4043a9dd1ab94463227-4c469cb957666757a122-recording15.trace'
```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-a-course-category-can-be-created-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-a-course-category-can-be-created-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-a-course-category-can-be-created-desktop/trace.zip`)

## BUG-021 · a learner cannot open the admin console

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:369 ›  › desktop › admin.spec.ts › admin console › a learner cannot open the admin console`
- **Steps:**
  - Before Hooks
  - Create context
  - Create page
  - Navigate
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('این بخش فقط برای مدیران است.')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByText('این بخش فقط برای مدیران است.') with timeout 15000ms[22m
[2m  - waiting for getByText('این بخش فقط برای مدیران است.')[22m

```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-a-learner-cannot-open-the-admin-console-desktop/test-failed-2.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-a-learner-cannot-open-the-admin-console-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-a-learner-cannot-open-the-admin-console-desktop/trace.zip`)

## BUG-022 · /blog renders without errors

- **Severity:** major
- **Area:** route smoke test
- **Test:** `specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /blog renders without errors`
- **Steps:**
  - Before Hooks
  - Navigate
  - /blog returned a server error
  - Expect "toBeVisible"
  - client/server errors:

  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-2/traces/4219922fea2e2bd3c691-d14811579868ab751ebc-recording94.network'
- **Suspect area:** `frontend/app/**`

```
Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-2/traces/4219922fea2e2bd3c691-d14811579868ab751ebc-recording94.network'
```

**Console errors**
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

**Screenshot:** `report/artifacts/desktop/smoke-route-smoke-test-blog-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/smoke-route-smoke-test-blog-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/smoke-route-smoke-test-blog-renders-without-errors-desktop/trace.zip`)

## BUG-023 · / renders without errors

- **Severity:** major
- **Area:** route smoke test
- **Test:** `specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › / renders without errors`
- **Steps:**
  - Before Hooks
  - Navigate
  - / returned a server error
  - Expect "toBeVisible"
  - client/server errors:

  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-0/traces/4219922fea2e2bd3c691-a8104568e2969dbb88fa.trace'
- **Suspect area:** `frontend/app/**`

```
Error: browserContext.close: ENOENT: no such file or directory, open '/home/ehsan/Workspace/GoLearn/e2e/report/artifacts/desktop/.playwright-artifacts-0/traces/4219922fea2e2bd3c691-a8104568e2969dbb88fa.trace'
```

**Console errors**
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

**Screenshot:** `report/artifacts/desktop/smoke-route-smoke-test-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/smoke-route-smoke-test-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/smoke-route-smoke-test-renders-without-errors-desktop/trace.zip`)

## BUG-024 · an admin can block and unblock a user

- **Severity:** critical
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:242 ›  › desktop › admin.spec.ts › admin console › an admin can block and unblock a user`
- **Steps:**
  - Before Hooks
  - Create request context
  - POST
  - Navigate
  - Fill "کاربر مسدود تست mw0p9aad98"
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: locator.fill: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
TimeoutError: locator.fill: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for locator('#user-q')[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**HTTP 5xx**
```
500 GET http://localhost:3100/api/v1/admin/users?sort=newest&page=1&per_page=20
```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-an-admin-can-block-and-unblock-a-user-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-an-admin-can-block-and-unblock-a-user-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-an-admin-can-block-and-unblock-a-user-desktop/trace.zip`)

## BUG-025 · a coupon is created and switched off

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:210 ›  › desktop › admin.spec.ts › admin console › a coupon is created and switched off`
- **Steps:**
  - Before Hooks
  - Navigate
  - Click
  - Fill "E2EMW0EKDBG48"
  - Select option
  - Fill "15"
  - Click
  - Expect "toHaveCount"
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('row').filter({ hasText: 'E2EMW0EKDBG48' }).getByText('15٪')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByRole('row').filter({ hasText: 'E2EMW0EKDBG48' }).getByText('15٪') with timeout 15000ms[22m
[2m  - waiting for getByRole('row').filter({ hasText: 'E2EMW0EKDBG48' }).getByText('15٪')[22m

```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-a-coupon-is-created-and-switched-off-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-a-coupon-is-created-and-switched-off-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-a-coupon-is-created-and-switched-off-desktop/trace.zip`)

## BUG-026 · a contact message reaches the admin inbox and can be closed

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:269 ›  › desktop › admin.spec.ts › admin console › a contact message reaches the admin inbox and can be closed`
- **Steps:**
  - Before Hooks
  - POST
  - Expect "toBe"
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Click
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: locator.click: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'بستن' }).first()[22m

```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-a-cont-8d6bc-min-inbox-and-can-be-closed-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-a-cont-8d6bc-min-inbox-and-can-be-closed-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-a-cont-8d6bc-min-inbox-and-can-be-closed-desktop/trace.zip`)

## BUG-027 · a paid order can be refunded from the admin console

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:298 ›  › desktop › admin.spec.ts › admin console › a paid order can be refunded from the admin console`
- **Steps:**
  - Before Hooks
  - Create context
  - POST
  - POST
  - POST
  - POST
  - Close context
  - Create context
  - Create request context
  - POST
  - Create page
  - Navigate
  - Wait for selector
  - Click
  - Wait for navigation
  - Click
  - Wait for load state "load"
  - Close context
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Click
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: locator.click: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for getByRole('row').filter({ hasText: 'پرداخت‌شده' }).first().getByRole('button', { name: 'بازگشت وجه' })[22m

```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-a-paid-ae76c-nded-from-the-admin-console-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-a-paid-ae76c-nded-from-the-admin-console-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-a-paid-ae76c-nded-from-the-admin-console-desktop/trace.zip`)

## BUG-028 · the cart collects courses, removes one, and pays the rest in one order

- **Severity:** major
- **Area:** cart.spec.ts
- **Test:** `specs/cart.spec.ts:13 ›  › desktop › cart.spec.ts › shopping cart › the cart collects courses, removes one, and pays the rest in one order`
- **Steps:**
  - Before Hooks
  - Create request context
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - POST
  - POST
  - POST
  - POST
  - POST
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Click
  - Expect "toBeVisible"
  - Navigate
  - Click
  - Expect "toBeVisible"
  - Navigate
  - Click
  - Expect "toBeVisible"
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Click
  - Expect "toBeHidden"
  - Expect "toBeVisible"
  - Click
  - Wait for navigation
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/**`

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

**Console errors**
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
```

**Screenshot:** `report/artifacts/desktop/cart-shopping-cart-the-car-9430a--pays-the-rest-in-one-order-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/cart-shopping-cart-the-car-9430a--pays-the-rest-in-one-order-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/cart-shopping-cart-the-car-9430a--pays-the-rest-in-one-order-desktop/trace.zip`)

## BUG-029 · a failed payment is resumable from the orders list without a second order

- **Severity:** major
- **Area:** cart.spec.ts
- **Test:** `specs/cart.spec.ts:62 ›  › desktop › cart.spec.ts › shopping cart › a failed payment is resumable from the orders list without a second order`
- **Steps:**
  - Before Hooks
  - Create request context
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Expect "toBeVisible"
  - Click
  - Wait for navigation
  - Click
  - Wait for load state "load"
  - Expect "toBeVisible"
  - Click
  - Wait for navigation
  - Expect "toBeVisible"
  - Navigate
  - Query count
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TypeError: Cannot read properties of undefined (reading 'unicode')
- **Suspect area:** `frontend/app/**`

```
TypeError: Cannot read properties of undefined (reading 'unicode')
```

**Screenshot:** `report/artifacts/desktop/cart-shopping-cart-a-faile-4d487-list-without-a-second-order-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/cart-shopping-cart-a-faile-4d487-list-without-a-second-order-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/cart-shopping-cart-a-faile-4d487-list-without-a-second-order-desktop/trace.zip`)

## BUG-030 · a guest cart asks for sign-in only at pay time

- **Severity:** major
- **Area:** cart.spec.ts
- **Test:** `specs/cart.spec.ts:116 ›  › desktop › cart.spec.ts › shopping cart › a guest cart asks for sign-in only at pay time`
- **Steps:**
  - Before Hooks
  - Create request context
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Click
  - Navigate
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TypeError: Cannot read properties of undefined (reading 'unicode')
- **Suspect area:** `frontend/app/**`

```
TypeError: Cannot read properties of undefined (reading 'unicode')
```

**Screenshot:** `report/artifacts/desktop/cart-shopping-cart-a-guest-88b49-or-sign-in-only-at-pay-time-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/cart-shopping-cart-a-guest-88b49-or-sign-in-only-at-pay-time-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/cart-shopping-cart-a-guest-88b49-or-sign-in-only-at-pay-time-desktop/trace.zip`)

## BUG-031 · a coupon lowers the payable amount

- **Severity:** major
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:126 ›  › desktop › checkout.spec.ts › checkout and payment › a coupon lowers the payable amount`
- **Steps:**
  - Before Hooks
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Expect "toBeVisible"
  - Fill "E2E10"
  - Click
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/** + backend/internal/repository/review.go`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('تخفیف', { exact: true })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByText('تخفیف', { exact: true }) with timeout 15000ms[22m
[2m  - waiting for getByText('تخفیف', { exact: true })[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 400 (Bad Request)
```

**Screenshot:** `report/artifacts/desktop/checkout-checkout-and-paym-12dd9-n-lowers-the-payable-amount-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/checkout-checkout-and-paym-12dd9-n-lowers-the-payable-amount-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/checkout-checkout-and-paym-12dd9-n-lowers-the-payable-amount-desktop/trace.zip`)

## BUG-032 · a course opens its own statistics page

- **Severity:** major
- **Area:** admin-stats.spec.ts
- **Test:** `specs/admin-stats.spec.ts:36 ›  › desktop › admin-stats.spec.ts › course statistics › a course opens its own statistics page`
- **Steps:**
  - Before Hooks
  - Navigate
  - Click
  - Click
  - Expect "toHaveURL"
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('دانشجو', { exact: true })
Expected: visible
Error: strict mode violation: getByText('دانشجو', { exact: true }) resolved to 2 elements:
    1) <p class="text-[11px] font-medium tracking-wide text-muted-foreground">دانشجو</p> aka getByRole('paragraph').filter({ hasText: 'دانشجو' })
    2) <th data-slot="table-head" class="h-10 px-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0 text-start text-[11px] font-medium tracking-wide text-muted-foreground">دانشجو</th> aka getByRole('columnheader', { name: 'دانشجو' })

Call log:
[2m  - Expect "toBeVisible" getByText('دانشجو', { exact: true }) with timeout 15000ms[22m
[2m  - waiting for getByText('دانشجو', { exact: true })[22m

```

**Screenshot:** `report/artifacts/desktop/admin-stats-course-statist-9a4b3-ens-its-own-statistics-page-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-stats-course-statist-9a4b3-ens-its-own-statistics-page-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-stats-course-statist-9a4b3-ens-its-own-statistics-page-desktop/trace.zip`)

## BUG-033 · the course page lists its learners and filters them

- **Severity:** major
- **Area:** admin-stats.spec.ts
- **Test:** `specs/admin-stats.spec.ts:57 ›  › desktop › admin-stats.spec.ts › course statistics › the course page lists its learners and filters them`
- **Steps:**
  - Before Hooks
  - Navigate
  - Click
  - Click
  - Expect "toHaveURL"
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: locator('section').filter({ hasText: 'دانشجوهای دوره' }).getByText('احسان ترابی فارسانی').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" locator('section').filter({ hasText: 'دانشجوهای دوره' }).getByText('احسان ترابی فارسانی').first() with timeout 15000ms[22m
[2m  - waiting for locator('section').filter({ hasText: 'دانشجوهای دوره' }).getByText('احسان ترابی فارسانی').first()[22m

```

**Screenshot:** `report/artifacts/desktop/admin-stats-course-statist-505d3-s-learners-and-filters-them-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-stats-course-statist-505d3-s-learners-and-filters-them-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-stats-course-statist-505d3-s-learners-and-filters-them-desktop/trace.zip`)

## BUG-034 · the course editor links to the statistics page

- **Severity:** major
- **Area:** admin-stats.spec.ts
- **Test:** `specs/admin-stats.spec.ts:85 ›  › desktop › admin-stats.spec.ts › course statistics › the course editor links to the statistics page`
- **Steps:**
  - Before Hooks
  - Navigate
  - Click
  - Click
  - Click
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: 'ویرایش دوره' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByRole('heading', { name: 'ویرایش دوره' }) with timeout 15000ms[22m
[2m  - waiting for getByRole('heading', { name: 'ویرایش دوره' })[22m

```

**Screenshot:** `report/artifacts/desktop/admin-stats-course-statist-d6f5c-inks-to-the-statistics-page-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-stats-course-statist-d6f5c-inks-to-the-statistics-page-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-stats-course-statist-d6f5c-inks-to-the-statistics-page-desktop/trace.zip`)

## BUG-035 · an empty cart sends the visitor to the courses

- **Severity:** major
- **Area:** cart.spec.ts
- **Test:** `specs/cart.spec.ts:113 ›  › desktop › cart.spec.ts › shopping cart › an empty cart sends the visitor to the courses`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('سبد خرید خالی است')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByText('سبد خرید خالی است') with timeout 15000ms[22m
[2m  - waiting for getByText('سبد خرید خالی است')[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Screenshot:** `report/artifacts/desktop/cart-shopping-cart-an-empt-67da0--the-visitor-to-the-courses-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/cart-shopping-cart-an-empt-67da0--the-visitor-to-the-courses-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/cart-shopping-cart-an-empt-67da0--the-visitor-to-the-courses-desktop/trace.zip`)

## BUG-036 · a guest cart asks for sign-in only at pay time

- **Severity:** major
- **Area:** cart.spec.ts
- **Test:** `specs/cart.spec.ts:120 ›  › desktop › cart.spec.ts › shopping cart › a guest cart asks for sign-in only at pay time`
- **Steps:**
  - Before Hooks
  - Create request context
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Click
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: locator.click: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/**`

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'افزودن به سبد خرید' })[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Screenshot:** `report/artifacts/desktop/cart-shopping-cart-a-guest-88b49-or-sign-in-only-at-pay-time-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/cart-shopping-cart-a-guest-88b49-or-sign-in-only-at-pay-time-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/cart-shopping-cart-a-guest-88b49-or-sign-in-only-at-pay-time-desktop/trace.zip`)

## BUG-037 · a guest is asked to sign in before paying

- **Severity:** major
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:15 ›  › desktop › checkout.spec.ts › checkout and payment › a guest is asked to sign in before paying`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/** + backend/internal/repository/review.go`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: 'برای خرید ابتدا وارد شو' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByRole('heading', { name: 'برای خرید ابتدا وارد شو' }) with timeout 15000ms[22m
[2m  - waiting for getByRole('heading', { name: 'برای خرید ابتدا وارد شو' })[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Screenshot:** `report/artifacts/desktop/checkout-checkout-and-paym-47894-ed-to-sign-in-before-paying-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/checkout-checkout-and-paym-47894-ed-to-sign-in-before-paying-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/checkout-checkout-and-paym-47894-ed-to-sign-in-before-paying-desktop/trace.zip`)

## BUG-038 · the learner buys a course with the mock gateway and gets access

- **Severity:** major
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:24 ›  › desktop › checkout.spec.ts › checkout and payment › the learner buys a course with the mock gateway and gets access`
- **Steps:**
  - Before Hooks
  - Create request context
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/** + backend/internal/repository/review.go`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: 'تسویه حساب' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByRole('heading', { name: 'تسویه حساب' }) with timeout 15000ms[22m
[2m  - waiting for getByRole('heading', { name: 'تسویه حساب' })[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Screenshot:** `report/artifacts/desktop/checkout-checkout-and-paym-e637d-ock-gateway-and-gets-access-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/checkout-checkout-and-paym-e637d-ock-gateway-and-gets-access-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/checkout-checkout-and-paym-e637d-ock-gateway-and-gets-access-desktop/trace.zip`)

## BUG-039 · buying the same course twice is refused

- **Severity:** major
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:63 ›  › desktop › checkout.spec.ts › checkout and payment › buying the same course twice is refused`
- **Steps:**
  - Before Hooks
  - Create request context
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/** + backend/internal/repository/review.go`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('قابل پرداخت')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByText('قابل پرداخت') with timeout 15000ms[22m
[2m  - waiting for getByText('قابل پرداخت')[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Screenshot:** `report/artifacts/desktop/checkout-checkout-and-paym-9c9ef-ame-course-twice-is-refused-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/checkout-checkout-and-paym-9c9ef-ame-course-twice-is-refused-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/checkout-checkout-and-paym-9c9ef-ame-course-twice-is-refused-desktop/trace.zip`)

## BUG-040 · a cancelled payment keeps the order payable and a retry succeeds

- **Severity:** major
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:87 ›  › desktop › checkout.spec.ts › checkout and payment › a cancelled payment keeps the order payable and a retry succeeds`
- **Steps:**
  - Before Hooks
  - Create request context
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/** + backend/internal/repository/review.go`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('قابل پرداخت')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByText('قابل پرداخت') with timeout 15000ms[22m
[2m  - waiting for getByText('قابل پرداخت')[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Screenshot:** `report/artifacts/desktop/checkout-checkout-and-paym-ddaf7-ayable-and-a-retry-succeeds-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/checkout-checkout-and-paym-ddaf7-ayable-and-a-retry-succeeds-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/checkout-checkout-and-paym-ddaf7-ayable-and-a-retry-succeeds-desktop/trace.zip`)

## BUG-041 · checkout without a course shows the empty state

- **Severity:** major
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:146 ›  › desktop › checkout.spec.ts › checkout and payment › checkout without a course shows the empty state`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/** + backend/internal/repository/review.go`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('دوره‌ای انتخاب نشده است')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByText('دوره‌ای انتخاب نشده است') with timeout 15000ms[22m
[2m  - waiting for getByText('دوره‌ای انتخاب نشده است')[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Screenshot:** `report/artifacts/desktop/checkout-checkout-and-paym-8cd02-ourse-shows-the-empty-state-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/checkout-checkout-and-paym-8cd02-ourse-shows-the-empty-state-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/checkout-checkout-and-paym-8cd02-ourse-shows-the-empty-state-desktop/trace.zip`)

## BUG-042 · the learner can sign in again after the session is lost

- **Severity:** major
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:153 ›  › desktop › checkout.spec.ts › checkout and payment › the learner can sign in again after the session is lost`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "09190000001"
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: locator.fill: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/** + backend/internal/repository/review.go`

```
TimeoutError: locator.fill: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for getByLabel('شماره موبایل')[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Screenshot:** `report/artifacts/desktop/checkout-checkout-and-paym-b4b32-n-after-the-session-is-lost-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/checkout-checkout-and-paym-b4b32-n-after-the-session-is-lost-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/checkout-checkout-and-paym-b4b32-n-after-the-session-is-lost-desktop/trace.zip`)

## BUG-043 · a blog post is written, published, visible on the blog and deletable

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:166 ›  › desktop › admin.spec.ts › admin console › a blog post is written, published, visible on the blog and deletable`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "نوشتهٔ تست E2E mwcpnhc132"
  - Fill "e2e-post-mwcpnhc179"
  - Fill "خلاصهٔ نوشتهٔ تست خودکار."
  - Click
  - Set input files
  - Expect "toBeVisible"
  - Expect "toHaveText"
  - Click
  - Click
  - Type "متن نوشتهٔ تست خودکار."
  - Click
  - Expect "toBeVisible"
  - Navigate
  - Fill "نوشتهٔ تست E2E mwcpnhc132"
  - Press "Enter"
  - Expect "toHaveCount"
  - Click
  - Click
  - Expect "toBeVisible"
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Navigate
  - Fill "نوشتهٔ تست E2E mwcpnhc132"
  - Press "Enter"
  - Click
  - Click
  - Click
  - Expect "toHaveCount"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  - 1[39m
[31m+ Received  + 7[39m

[32m- Array [][39m
[31m+ Array [[39m
[31m+   "Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:[39m
[31m+[39m
[31m+ - A server/client branch `if (typeof window !== 'undefined')`.[39m
[31m+ - Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.[39m
[31m+ - Date formatting in a user's locale which doesn't m",[39m
[31m+ ][39m
```

**Console errors**
```
In HTML, %s cannot be a descendant of <%s>.
This will cause a hydration error.%s <button> button 

  ...
    <RedirectErrorBoundary router={{...}}>
      <InnerLayoutRouter url="/blog/e2e-..." tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
        <SegmentViewNode type="page" pagePath="(site)/blo...">
          <SegmentTrieNode>
          <BlogPostPage>
            <article cla
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. button <button>
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Failed requests**
```
PUT http://localhost:9000/golearn-media/media/image/2026/11/01a1cccc-afc7-76ff-b4cc-31a7f3dd7e91/sample.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20261111%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261111T224848Z&X-Amz-Expires=600&X-Amz-SignedHeaders=content-type%3Bhost&x-id=PutObject&X-Amz-Signature=560806f9856c84f8164cc707ca9424b43fd5c61b3a7c898fa6dc8cb9f75321b3 :: net::ERR_ABORTED
```

**Screenshot:** `report/artifacts/desktop/admin-admin-console-a-blog-06728-e-on-the-blog-and-deletable-desktop/test-failed-1.png`

**Trace:** `report/artifacts/desktop/admin-admin-console-a-blog-06728-e-on-the-blog-and-deletable-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/desktop/admin-admin-console-a-blog-06728-e-on-the-blog-and-deletable-desktop/trace.zip`)

## Observations — tests passed but the page logged errors

- **15×** Failed to load resource: the server responded with a status of 400 (Bad Request)
  - e.g. “a coupon is created and switched off”, “a coupon is created and switched off”, “a coupon is created and switched off”, “a coupon is created and switched off”, “a coupon is created and switched off”
- **279×** Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - e.g. “a new mobile registers, verifies the OTP and lands on the dashboard”, “registration rejects a password that is too short”, “login with a wrong password shows an error and stays on the login page”, “login with the correct password opens the learner dashboard”, “login with an SMS code opens the learner dashboard”
- **23×** Failed to load resource: the server responded with a status of 404 (Not Found)
  - e.g. “unknown course slug renders the not-found page”, “unknown course slug renders the not-found page”, “unknown course slug renders the not-found page”, “unknown course slug renders the not-found page”, “unknown course slug renders the not-found page”
