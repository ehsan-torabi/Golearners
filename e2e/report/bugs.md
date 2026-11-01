# GoLearn — E2E bug report

Generated 2026-11-01T23:43:19.451Z · 500s · 24 passed · 29 failed · 3 skipped · 0 flaky (56 total)

Every entry below is reproducible with `cd e2e && bunx playwright test <test file>`.

## Index

| ID | Severity | Area | Title |
|----|----------|------|-------|
| BUG-001 | major | admin console | the overview shows the platform numbers |
| BUG-002 | major | admin console | a course is created, gets a curriculum, is published and shows up on the site |
| BUG-003 | major | admin console | the cover image is uploaded through the media field |
| BUG-004 | major | admin console | a blog post is written, published, visible on the blog and deletable |
| BUG-005 | major | admin console | a coupon is created and switched off |
| BUG-006 | major | admin console | an admin can block and unblock a user |
| BUG-007 | major | admin console | a contact message reaches the admin inbox and can be closed |
| BUG-008 | major | admin console | a paid order can be refunded from the admin console |
| BUG-009 | major | authentication | a new mobile registers, verifies the OTP and lands on the dashboard |
| BUG-010 | critical | authentication | a signed-in learner sees the dashboard entry in the navbar |
| BUG-011 | critical | checkout & payment | the learner buys a course with the mock gateway and gets access |
| BUG-012 | critical | checkout & payment | buying the same course twice is refused |
| BUG-013 | critical | checkout & payment | a cancelled payment keeps the order payable and a retry succeeds |
| BUG-014 | major | checkout & payment | a coupon lowers the payable amount |
| BUG-015 | critical | learner dashboard | the course player lists the lessons and asks for a signed playback URL |
| BUG-016 | critical | learner dashboard | the player stores the playback progress |
| BUG-017 | major | learner dashboard | the orders page lists a paid order |
| BUG-018 | major | public site | home page renders hero, course sections and FAQ |
| BUG-019 | major | public site | courses list shows cards that lead to a detail page |
| BUG-020 | major | public site | course search finds the known course |
| BUG-021 | major | public site | course detail shows curriculum and a guest purchase CTA |
| BUG-022 | major | public site | blog list renders posts or the empty state |
| BUG-023 | major | public site | contact form stores a message and confirms |
| BUG-024 | major | public site | contact form rejects a too short message |
| BUG-025 | major | public site | theme toggle switches the colour scheme |
| BUG-026 | major | route smoke test | /courses renders without errors |
| BUG-027 | major | route smoke test | /courses/go-from-zero renders without errors |
| BUG-028 | major | route smoke test | /blog renders without errors |
| BUG-029 | major | route smoke test | /contact renders without errors |

## BUG-001 · the overview shows the platform numbers

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:22 ›  › desktop › admin.spec.ts › admin console › the overview shows the platform numbers`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('درآمد')
Expected: visible
Error: strict mode violation: getByText('درآمد') resolved to 2 elements:
    1) <p class="text-xs text-muted-foreground">درآمد</p> aka getByRole('paragraph').filter({ hasText: 'درآمد' })
    2) <th scope="col" class="px-5 py-3 text-start font-medium">درآمد</th> aka getByRole('columnheader', { name: 'درآمد' })

Call log:
[2m  - Expect "toBeVisible" getByText('درآمد') with timeout 15000ms[22m
[2m  - waiting for getByText('درآمد')[22m

```

**Screenshot:** `report/artifacts/admin-admin-console-the-overview-shows-the-platform-numbers-desktop/test-failed-1.png`

**Trace:** `report/artifacts/admin-admin-console-the-overview-shows-the-platform-numbers-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/admin-admin-console-the-overview-shows-the-platform-numbers-desktop/trace.zip`)

## BUG-002 · a course is created, gets a curriculum, is published and shows up on the site

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:33 ›  › desktop › admin.spec.ts › admin console › a course is created, gets a curriculum, is published and shows up on the site`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "دورهٔ مدیریت تست 1793576104459"
  - Fill "e2e-admin-1793576104459"
  - Select option
  - Fill "25000"
  - Fill "خلاصهٔ دورهٔ ساخته‌شده توسط تست خودکار."
  - Click
  - Expect "toBeVisible"
  - Navigate
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByLabel('جست‌وجوی دوره')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByLabel('جست‌وجوی دوره') with timeout 15000ms[22m
[2m  - waiting for getByLabel('جست‌وجوی دوره')[22m

```

**Screenshot:** `report/artifacts/admin-admin-console-a-cour-1bea5-ed-and-shows-up-on-the-site-desktop/test-failed-1.png`

**Trace:** `report/artifacts/admin-admin-console-a-cour-1bea5-ed-and-shows-up-on-the-site-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/admin-admin-console-a-cour-1bea5-ed-and-shows-up-on-the-site-desktop/trace.zip`)

## BUG-003 · the cover image is uploaded through the media field

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:88 ›  › desktop › admin.spec.ts › admin console › the cover image is uploaded through the media field`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "دورهٔ مدیریت تست 1793576130170"
  - Click
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: locator.click: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'جست‌وجو' })[22m

```

**Screenshot:** `report/artifacts/admin-admin-console-the-co-93497-ded-through-the-media-field-desktop/test-failed-1.png`

**Trace:** `report/artifacts/admin-admin-console-the-co-93497-ded-through-the-media-field-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/admin-admin-console-the-co-93497-ded-through-the-media-field-desktop/trace.zip`)

## BUG-004 · a blog post is written, published, visible on the blog and deletable

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:107 ›  › desktop › admin.spec.ts › admin console › a blog post is written, published, visible on the blog and deletable`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "نوشتهٔ تست E2E 1793576153900"
  - Fill "e2e-post-1793576153900"
  - Fill "خلاصهٔ نوشتهٔ تست خودکار."
  - Click
  - Click
  - Type "متن نوشتهٔ تست خودکار."
  - Click
  - Expect "toBeVisible"
  - Navigate
  - Fill "نوشتهٔ تست E2E 1793576153900"
  - Click
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: locator.click: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: 'جست‌وجو' })[22m

```

**Screenshot:** `report/artifacts/admin-admin-console-a-blog-06728-e-on-the-blog-and-deletable-desktop/test-failed-1.png`

**Trace:** `report/artifacts/admin-admin-console-a-blog-06728-e-on-the-blog-and-deletable-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/admin-admin-console-a-blog-06728-e-on-the-blog-and-deletable-desktop/trace.zip`)

## BUG-005 · a coupon is created and switched off

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:148 ›  › desktop › admin.spec.ts › admin console › a coupon is created and switched off`
- **Steps:**
  - Before Hooks
  - Navigate
  - Click
  - Fill "E2E81049"
  - Select option
  - Fill "15"
  - Click
  - Expect "toHaveCount"
  - After Hooks
  - Worker Cleanup
- **Expected:** [32m1[39m
- **Actual:** [31m0[39m
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

Locator:  getByRole('row').filter({ hasText: 'E2E81049' })
Expected: [32m1[39m
Received: [31m0[39m
Timeout:  15000ms

Call log:
[2m  - Expect "toHaveCount" getByRole('row').filter({ hasText: 'E2E81049' }) with timeout 15000ms[22m
[2m  - waiting for getByRole('row').filter({ hasText: 'E2E81049' })[22m
[2m    34 × locator resolved to 0 elements[22m
[2m       - unexpected value "0"[22m

```

**Console errors**
```
Each child in a list should have a unique "key" prop.%s%s See https://react.dev/link/warning-keys for more information. 

Check the render method of `TableBody`.  It was passed a child from AdminCouponsPage.
In HTML, %s cannot be a child of <%s>.%s
This will cause a hydration error.%s <div> table  

  ...
    <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
      <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
        <LoadingBoundary loading={null}>
          <HTTPAccessFallbackBoundary notFound={undefined} forbidden={
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. table <div>
```

**Screenshot:** `report/artifacts/admin-admin-console-a-coupon-is-created-and-switched-off-desktop/test-failed-1.png`

**Trace:** `report/artifacts/admin-admin-console-a-coupon-is-created-and-switched-off-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/admin-admin-console-a-coupon-is-created-and-switched-off-desktop/trace.zip`)

## BUG-006 · an admin can block and unblock a user

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:167 ›  › desktop › admin.spec.ts › admin console › an admin can block and unblock a user`
- **Steps:**
  - Before Hooks
  - Create request context
  - POST
  - Navigate
  - Fill "091317011749"
  - Click
  - Expect "toHaveCount"
  - After Hooks
  - Worker Cleanup
- **Expected:** [32m1[39m
- **Actual:** [31m0[39m
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

Locator:  getByRole('row').filter({ hasText: '091317011749' })
Expected: [32m1[39m
Received: [31m0[39m
Timeout:  15000ms

Call log:
[2m  - Expect "toHaveCount" getByRole('row').filter({ hasText: '091317011749' }) with timeout 15000ms[22m
[2m  - waiting for getByRole('row').filter({ hasText: '091317011749' })[22m
[2m    34 × locator resolved to 0 elements[22m
[2m       - unexpected value "0"[22m

```

**Screenshot:** `report/artifacts/admin-admin-console-an-admin-can-block-and-unblock-a-user-desktop/test-failed-1.png`

**Trace:** `report/artifacts/admin-admin-console-an-admin-can-block-and-unblock-a-user-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/admin-admin-console-an-admin-can-block-and-unblock-a-user-desktop/trace.zip`)

## BUG-007 · a contact message reaches the admin inbox and can be closed

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:190 ›  › desktop › admin.spec.ts › admin console › a contact message reaches the admin inbox and can be closed`
- **Steps:**
  - Before Hooks
  - POST
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('کاربر پیام تست').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByText('کاربر پیام تست').first() with timeout 15000ms[22m
[2m  - waiting for getByText('کاربر پیام تست').first()[22m

```

**Screenshot:** `report/artifacts/admin-admin-console-a-cont-8d6bc-min-inbox-and-can-be-closed-desktop/test-failed-1.png`

**Trace:** `report/artifacts/admin-admin-console-a-cont-8d6bc-min-inbox-and-can-be-closed-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/admin-admin-console-a-cont-8d6bc-min-inbox-and-can-be-closed-desktop/trace.zip`)

## BUG-008 · a paid order can be refunded from the admin console

- **Severity:** major
- **Area:** admin console
- **Test:** `specs/admin.spec.ts:209 ›  › desktop › admin.spec.ts › admin console › a paid order can be refunded from the admin console`
- **Steps:**
  - Before Hooks
  - Create context
  - POST
  - POST
  - POST
  - POST
  - Close context
  - Create context
  - Create page
  - Navigate
  - Wait for selector
  - Click
  - Wait for navigation
  - Click
  - Wait for navigation
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(app)/admin/** + frontend/components/admin/**`

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

**Screenshot:** `report/artifacts/admin-admin-console-a-paid-ae76c-nded-from-the-admin-console-desktop/test-failed-1.png`

**Trace:** `report/artifacts/admin-admin-console-a-paid-ae76c-nded-from-the-admin-console-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/admin-admin-console-a-paid-ae76c-nded-from-the-admin-console-desktop/trace.zip`)

## BUG-009 · a new mobile registers, verifies the OTP and lands on the dashboard

- **Severity:** major
- **Area:** authentication
- **Test:** `specs/auth.spec.ts:13 ›  › desktop › auth.spec.ts › authentication › a new mobile registers, verifies the OTP and lands on the dashboard`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "کاربر تازهٔ تست"
  - Fill "091378338732"
  - Fill "E2Enewuser2026"
  - Click
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: 'تأیید شماره موبایل' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByRole('heading', { name: 'تأیید شماره موبایل' }) with timeout 15000ms[22m
[2m  - waiting for getByRole('heading', { name: 'تأیید شماره موبایل' })[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
Failed to load resource: the server responded with a status of 400 (Bad Request)
```

**Screenshot:** `report/artifacts/auth-authentication-a-new--1c840--and-lands-on-the-dashboard-desktop/test-failed-1.png`

**Trace:** `report/artifacts/auth-authentication-a-new--1c840--and-lands-on-the-dashboard-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/auth-authentication-a-new--1c840--and-lands-on-the-dashboard-desktop/trace.zip`)

## BUG-010 · a signed-in learner sees the dashboard entry in the navbar

- **Severity:** critical
- **Area:** authentication
- **Test:** `specs/auth.spec.ts:99 ›  › desktop › auth.spec.ts › authentication › a signed-in learner sees the dashboard entry in the navbar`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "09190000001"
  - Fill "Learner2026!"
  - Click
  - Wait for navigation
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
- **Suspect area:** `route /login?mobile=&password=Learner2026%21 (frontend/app/login?mobile=&password=Learner2026%21/page.tsx or its client component)`, `frontend/app/(site)/(auth)/** + backend/internal/transport/httpapi/auth.go`

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/dashboard" until "load"
  navigated to "http://localhost:3000/login?mobile=&password=Learner2026%21"
============================================================
```

**Console errors**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
./components/admin/messages.tsx
Module parse failed: Identifier 'setStatus' has already been declared (91:19)
|         load
|     ]);
>     async function setStatus(id, status) {
|         setError("");
|         setBusy(id);
./components/admin/messages.tsx
Module parse failed: Identifier 'setStatus' has already been declared (96:19)
|         load
|     ]);
>     async function setStatus(id, status) {
|         setError("");
|         setBusy(id);

Import trace for requested module:
./components/admin/messages.tsx
Failed to load resource: the server responded with a status of 404 (Not Found)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
ModuleParseError: Module parse failed: Identifier 'setStatus' has already been declared (96:19)
File was processed with these loaders:
 * ./node_modules/next/dist/compiled/@next/react-refresh-utils/dist/loader.js
 * ./node_modules/next/dist/build/webpack/loaders/next-flight-client-module-loader.js
 * ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js
You may need an additional loade
```

**HTTP 5xx**
```
500 GET http://localhost:3000/login
```

**Failed requests**
```
GET http://localhost:3000/login :: net::ERR_ABORTED
```

**Screenshot:** `report/artifacts/auth-authentication-a-sign-6a34c-shboard-entry-in-the-navbar-desktop/test-failed-1.png`

**Trace:** `report/artifacts/auth-authentication-a-sign-6a34c-shboard-entry-in-the-navbar-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/auth-authentication-a-sign-6a34c-shboard-entry-in-the-navbar-desktop/trace.zip`)

## BUG-011 · the learner buys a course with the mock gateway and gets access

- **Severity:** critical
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:24 ›  › desktop › checkout.spec.ts › checkout and payment › the learner buys a course with the mock gateway and gets access`
- **Steps:**
  - Before Hooks
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Click
  - Wait for navigation
  - Click
  - Wait for navigation
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/**`

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

**Console errors**
```
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**HTTP 5xx**
```
500 GET http://localhost:3000/api/v1/payments/callback/mock?ref=01a1997b-294f-7bf6-bef2-15587332639b&Status=OK
```

**Screenshot:** `report/artifacts/checkout-checkout-and-paym-e637d-ock-gateway-and-gets-access-desktop/test-failed-1.png`

**Trace:** `report/artifacts/checkout-checkout-and-paym-e637d-ock-gateway-and-gets-access-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/checkout-checkout-and-paym-e637d-ock-gateway-and-gets-access-desktop/trace.zip`)

## BUG-012 · buying the same course twice is refused

- **Severity:** critical
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:58 ›  › desktop › checkout.spec.ts › checkout and payment › buying the same course twice is refused`
- **Steps:**
  - Before Hooks
  - Create request context
  - POST
  - POST
  - POST
  - POST
  - Navigate
  - Expect "toBeVisible"
  - Click
  - Wait for navigation
  - Click
  - Wait for navigation
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/**`

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

**Console errors**
```
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**HTTP 5xx**
```
500 GET http://localhost:3000/api/v1/payments/callback/mock?ref=01a1997b-8349-7060-b728-c477a2d2c66f&Status=OK
```

**Screenshot:** `report/artifacts/checkout-checkout-and-paym-9c9ef-ame-course-twice-is-refused-desktop/test-failed-1.png`

**Trace:** `report/artifacts/checkout-checkout-and-paym-9c9ef-ame-course-twice-is-refused-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/checkout-checkout-and-paym-9c9ef-ame-course-twice-is-refused-desktop/trace.zip`)

## BUG-013 · a cancelled payment keeps the order payable and a retry succeeds

- **Severity:** critical
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:80 ›  › desktop › checkout.spec.ts › checkout and payment › a cancelled payment keeps the order payable and a retry succeeds`
- **Steps:**
  - Before Hooks
  - Create request context
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
  - Navigate
  - Expect "toBeVisible"
  - Navigate
  - Expect "toBeVisible"
  - Click
  - Wait for navigation
  - Click
  - Wait for navigation
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/**`

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

**Console errors**
```
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**HTTP 5xx**
```
500 GET http://localhost:3000/api/v1/payments/callback/mock?ref=01a1997b-f5dd-722c-a20e-9b1ec2585fd8&Status=OK
```

**Screenshot:** `report/artifacts/checkout-checkout-and-paym-ddaf7-ayable-and-a-retry-succeeds-desktop/test-failed-1.png`

**Trace:** `report/artifacts/checkout-checkout-and-paym-ddaf7-ayable-and-a-retry-succeeds-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/checkout-checkout-and-paym-ddaf7-ayable-and-a-retry-succeeds-desktop/trace.zip`)

## BUG-014 · a coupon lowers the payable amount

- **Severity:** major
- **Area:** checkout & payment
- **Test:** `specs/checkout.spec.ts:117 ›  › desktop › checkout.spec.ts › checkout and payment › a coupon lowers the payable amount`
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
- **Suspect area:** `frontend/app/(site)/checkout/** + backend/internal/service/checkout/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('تخفیف')
Expected: visible
Error: strict mode violation: getByText('تخفیف') resolved to 2 elements:
    1) <span class="text-foreground">دورهٔ تخفیف تست 1793576421924</span> aka getByText('دورهٔ تخفیف تست')
    2) <label for="coupon" class="block text-sm font-medium text-foreground">کد تخفیف</label> aka getByText('کد تخفیف')

Call log:
[2m  - Expect "toBeVisible" getByText('تخفیف') with timeout 15000ms[22m
[2m  - waiting for getByText('تخفیف')[22m

```

**Console errors**
```
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Screenshot:** `report/artifacts/checkout-checkout-and-paym-12dd9-n-lowers-the-payable-amount-desktop/test-failed-1.png`

**Trace:** `report/artifacts/checkout-checkout-and-paym-12dd9-n-lowers-the-payable-amount-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/checkout-checkout-and-paym-12dd9-n-lowers-the-payable-amount-desktop/trace.zip`)

## BUG-015 · the course player lists the lessons and asks for a signed playback URL

- **Severity:** critical
- **Area:** learner dashboard
- **Test:** `specs/learner.spec.ts:93 ›  › desktop › learner.spec.ts › learner dashboard › the course player lists the lessons and asks for a signed playback URL`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - Click
  - Wait for navigation
  - Click
  - Wait for navigation
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
- **Suspect area:** `frontend/app/(app)/dashboard/**`

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

**Console errors**
```
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**HTTP 5xx**
```
500 GET http://localhost:3000/api/v1/payments/callback/mock?ref=01a1997c-a947-7a48-a177-9503857fbfee&Status=OK
```

**Screenshot:** `report/artifacts/learner-learner-dashboard--9d2a7-s-for-a-signed-playback-URL-desktop/test-failed-1.png`

**Trace:** `report/artifacts/learner-learner-dashboard--9d2a7-s-for-a-signed-playback-URL-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/learner-learner-dashboard--9d2a7-s-for-a-signed-playback-URL-desktop/trace.zip`)

## BUG-016 · the player stores the playback progress

- **Severity:** critical
- **Area:** learner dashboard
- **Test:** `specs/learner.spec.ts:120 ›  › desktop › learner.spec.ts › learner dashboard › the player stores the playback progress`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(app)/dashboard/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: locator('video')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" locator('video') with timeout 15000ms[22m
[2m  - waiting for locator('video')[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**Uncaught page errors**
```
TypeError: fetch failed
```

**HTTP 5xx**
```
500 GET http://localhost:3000/dashboard/courses/e2e-play-1793576467314
```

**Screenshot:** `report/artifacts/learner-learner-dashboard--4bde4-tores-the-playback-progress-desktop/test-failed-1.png`

**Trace:** `report/artifacts/learner-learner-dashboard--4bde4-tores-the-playback-progress-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/learner-learner-dashboard--4bde4-tores-the-playback-progress-desktop/trace.zip`)

## BUG-017 · the orders page lists a paid order

- **Severity:** major
- **Area:** learner dashboard
- **Test:** `specs/learner.spec.ts:134 ›  › desktop › learner.spec.ts › learner dashboard › the orders page lists a paid order`
- **Steps:**
  - Before Hooks
  - After Hooks
  - Worker Cleanup
- **Expected:** the page to render the expected content and finish the flow without errors
- **Actual:** Error: media register failed: 400 {"error":{"code":"VALIDATION_ERROR","message":"اطلاعات ارسالی نامعتبر است."}}
- **Suspect area:** `frontend/app/(app)/dashboard/**`

```
Error: media register failed: 400 {"error":{"code":"VALIDATION_ERROR","message":"اطلاعات ارسالی نامعتبر است."}}

```

**Trace:** `report/artifacts/learner-learner-dashboard-the-orders-page-lists-a-paid-order-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/learner-learner-dashboard-the-orders-page-lists-a-paid-order-desktop/trace.zip`)

## BUG-018 · home page renders hero, course sections and FAQ

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:4 ›  › desktop › site.spec.ts › public site › home page renders hero, course sections and FAQ`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - After Hooks
  - Worker Cleanup
- **Expected:** visible
- **Actual:** Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed
- **Suspect area:** `frontend/app/(site)/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: 'سوال‌های پرتکرار' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByRole('heading', { name: 'سوال‌های پرتکرار' }) with timeout 15000ms[22m
[2m  - waiting for getByRole('heading', { name: 'سوال‌های پرتکرار' })[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Failed requests**
```
GET http://localhost:3000/?_rsc=lbM93OMqs1zMa9GK :: net::ERR_ABORTED
```

**Screenshot:** `report/artifacts/site-public-site-home-page-7bbc0-ero-course-sections-and-FAQ-desktop/test-failed-1.png`

**Trace:** `report/artifacts/site-public-site-home-page-7bbc0-ero-course-sections-and-FAQ-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/site-public-site-home-page-7bbc0-ero-course-sections-and-FAQ-desktop/trace.zip`)

## BUG-019 · courses list shows cards that lead to a detail page

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:17 ›  › desktop › site.spec.ts › public site › courses list shows cards that lead to a detail page`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Click
  - Expect "toHaveURL"
  - Expect "toBeVisible"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/(site)/**`

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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/site-public-site-courses-l-93a01--that-lead-to-a-detail-page-desktop/test-failed-1.png`

**Trace:** `report/artifacts/site-public-site-courses-l-93a01--that-lead-to-a-detail-page-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/site-public-site-courses-l-93a01--that-lead-to-a-detail-page-desktop/trace.zip`)

## BUG-020 · course search finds the known course

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:30 ›  › desktop › site.spec.ts › public site › course search finds the known course`
- **Steps:**
  - Before Hooks
  - Navigate
  - Click
  - Wait for load state "load"
  - Expect "toBeVisible"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** -  1[39m
- **Actual:** + 12[39m
- **Suspect area:** `frontend/app/(site)/**`

```
Error: client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m

[2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected  -  1[39m
[31m+ Received  + 12[39m

[32m- Array [][39m
[31m+ Array [[39m
[31m+   "Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:[39m
[31m+[39m
[31m+ - A server/client branch `if (typeof window !== 'undefined')`.[39m
[31m+ - Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.[39m
[31m+ - Date formatting in a user's locale which doesn't m",[39m
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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
In HTML, %s cannot be a descendant of <%s>.
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/site-public-site-course-search-finds-the-known-course-desktop/test-failed-1.png`

**Trace:** `report/artifacts/site-public-site-course-search-finds-the-known-course-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/site-public-site-course-search-finds-the-known-course-desktop/trace.zip`)

## BUG-021 · course detail shows curriculum and a guest purchase CTA

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:42 ›  › desktop › site.spec.ts › public site › course detail shows curriculum and a guest purchase CTA`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/(site)/**`

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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/site-public-site-course-de-5fd91-um-and-a-guest-purchase-CTA-desktop/test-failed-1.png`

**Trace:** `report/artifacts/site-public-site-course-de-5fd91-um-and-a-guest-purchase-CTA-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/site-public-site-course-de-5fd91-um-and-a-guest-purchase-CTA-desktop/trace.zip`)

## BUG-022 · blog list renders posts or the empty state

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:59 ›  › desktop › site.spec.ts › public site › blog list renders posts or the empty state`
- **Steps:**
  - Before Hooks
  - Navigate
  - Expect "toBeVisible"
  - Expect "toBeVisible"
  - Click
  - Expect "toBeVisible"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/(site)/**`

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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/site-public-site-blog-list-renders-posts-or-the-empty-state-desktop/test-failed-1.png`

**Trace:** `report/artifacts/site-public-site-blog-list-renders-posts-or-the-empty-state-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/site-public-site-blog-list-renders-posts-or-the-empty-state-desktop/trace.zip`)

## BUG-023 · contact form stores a message and confirms

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:86 ›  › desktop › site.spec.ts › public site › contact form stores a message and confirms`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "کاربر تست E2E"
  - Fill "09121110099"
  - Fill "این یک پیام تست خودکار از تست E2E است."
  - Click
  - Expect "toBeVisible"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/(site)/**`

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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/site-public-site-contact-form-stores-a-message-and-confirms-desktop/test-failed-1.png`

**Trace:** `report/artifacts/site-public-site-contact-form-stores-a-message-and-confirms-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/site-public-site-contact-form-stores-a-message-and-confirms-desktop/trace.zip`)

## BUG-024 · contact form rejects a too short message

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:99 ›  › desktop › site.spec.ts › public site › contact form rejects a too short message`
- **Steps:**
  - Before Hooks
  - Navigate
  - Fill "کاربر تست E2E"
  - Fill "09121110098"
  - Fill "کوتاه"
  - Click
  - Expect "toBeHidden"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/(site)/**`

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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/site-public-site-contact-form-rejects-a-too-short-message-desktop/test-failed-1.png`

**Trace:** `report/artifacts/site-public-site-contact-form-rejects-a-too-short-message-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/site-public-site-contact-form-rejects-a-too-short-message-desktop/trace.zip`)

## BUG-025 · theme toggle switches the colour scheme

- **Severity:** major
- **Area:** public site
- **Test:** `specs/site.spec.ts:139 ›  › desktop › site.spec.ts › public site › theme toggle switches the colour scheme`
- **Steps:**
  - Before Hooks
  - Navigate
  - Click
  - Expect "not toHaveClass"
  - After Hooks
  - Worker Cleanup
- **Expected:** not [32m""[39m
- **Actual:** [31m""[39m
- **Suspect area:** `frontend/app/(site)/**`

```
Error: [2mexpect([22m[31mlocator[39m[2m).not.[22mtoHaveClass[2m([22m[32mexpected[39m[2m)[22m failed

Locator:  locator('html')
Expected: not [32m""[39m
Received: [31m""[39m
Timeout:  15000ms

Call log:
[2m  - Expect "not toHaveClass" locator('html') with timeout 15000ms[22m
[2m  - waiting for locator('html')[22m
[2m    33 × locator resolved to <html lang="fa" dir="rtl" data-theme="dark">…</html>[22m
[2m       - unexpected value ""[22m

```

**Console errors**
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Screenshot:** `report/artifacts/site-public-site-theme-toggle-switches-the-colour-scheme-desktop/test-failed-1.png`

**Trace:** `report/artifacts/site-public-site-theme-toggle-switches-the-colour-scheme-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/site-public-site-theme-toggle-switches-the-colour-scheme-desktop/trace.zip`)

## BUG-026 · /courses renders without errors

- **Severity:** major
- **Area:** route smoke test
- **Test:** `specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /courses renders without errors`
- **Steps:**
  - Before Hooks
  - Navigate
  - /courses returned a server error
  - Expect "toBeVisible"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/**`

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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/smoke-route-smoke-test-courses-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/smoke-route-smoke-test-courses-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/smoke-route-smoke-test-courses-renders-without-errors-desktop/trace.zip`)

## BUG-027 · /courses/go-from-zero renders without errors

- **Severity:** major
- **Area:** route smoke test
- **Test:** `specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /courses/go-from-zero renders without errors`
- **Steps:**
  - Before Hooks
  - Navigate
  - /courses/go-from-zero returned a server error
  - Expect "toBeVisible"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/**`

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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/smoke-route-smoke-test-cou-8019c-zero-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/smoke-route-smoke-test-cou-8019c-zero-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/smoke-route-smoke-test-cou-8019c-zero-renders-without-errors-desktop/trace.zip`)

## BUG-028 · /blog renders without errors

- **Severity:** major
- **Area:** route smoke test
- **Test:** `specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /blog renders without errors`
- **Steps:**
  - Before Hooks
  - Navigate
  - /blog returned a server error
  - Expect "toBeVisible"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/**`

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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/smoke-route-smoke-test-blog-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/smoke-route-smoke-test-blog-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/smoke-route-smoke-test-blog-renders-without-errors-desktop/trace.zip`)

## BUG-029 · /contact renders without errors

- **Severity:** major
- **Area:** route smoke test
- **Test:** `specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /contact renders without errors`
- **Steps:**
  - Before Hooks
  - Navigate
  - /contact returned a server error
  - Expect "toBeVisible"
  - client/server errors:
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
  - After Hooks
  - Worker Cleanup
- **Expected:** - 1[39m
- **Actual:** + 7[39m
- **Suspect area:** `frontend/app/**`

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
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPA
<%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Failed to load resource: the server responded with a status of 401 (Unauthorized)
Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
```

**Uncaught page errors**
```
Error: Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't m
```

**Screenshot:** `report/artifacts/smoke-route-smoke-test-contact-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/smoke-route-smoke-test-contact-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/smoke-route-smoke-test-contact-renders-without-errors-desktop/trace.zip`)

## Observations — tests passed but the page logged errors

- **admin console › the audit log lists the admin mutations** (`specs/admin.spec.ts:262 ›  › desktop › admin.spec.ts › admin console › the audit log lists the admin mutations`)
  - console: In HTML, %s cannot be a child of <%s>.%s
This will cause a hydration error.%s <div> table  

  ...
    <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:false, ...}}>
      <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
        <LoadingBoundary loading={null}>
          <HTTPAccessFallbackBoundary notFound={undefined} forbidden={
  - console: <%s> cannot contain a nested %s.
See this log for the ancestor stack trace. table <div>
- **authentication › registration rejects a password that is too short** (`specs/auth.spec.ts:31 ›  › desktop › auth.spec.ts › authentication › registration rejects a password that is too short`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
  - console: Failed to load resource: the server responded with a status of 400 (Bad Request)
- **authentication › login with a wrong password shows an error and stays on the login page** (`specs/auth.spec.ts:44 ›  › desktop › auth.spec.ts › authentication › login with a wrong password shows an error and stays on the login page`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **authentication › login with the correct password opens the learner dashboard** (`specs/auth.spec.ts:59 ›  › desktop › auth.spec.ts › authentication › login with the correct password opens the learner dashboard`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **authentication › login with an SMS code opens the learner dashboard** (`specs/auth.spec.ts:67 ›  › desktop › auth.spec.ts › authentication › login with an SMS code opens the learner dashboard`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **authentication › logout clears the session and returns to the login page** (`specs/auth.spec.ts:81 ›  › desktop › auth.spec.ts › authentication › logout clears the session and returns to the login page`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- **authentication › the dashboard asks anonymous visitors to sign in** (`specs/auth.spec.ts:91 ›  › desktop › auth.spec.ts › authentication › the dashboard asks anonymous visitors to sign in`)
  - console: ./components/admin/messages.tsx
Module parse failed: Identifier 'setStatus' has already been declared (91:19)
|         load
|     ]);
>     async function setStatus(id, status) {
|         setError("");
|         setBusy(id);
- **checkout & payment › a guest is asked to sign in before paying** (`specs/checkout.spec.ts:15 ›  › desktop › checkout.spec.ts › checkout and payment › a guest is asked to sign in before paying`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- **checkout & payment › checkout without a course shows the empty state** (`specs/checkout.spec.ts:135 ›  › desktop › checkout.spec.ts › checkout and payment › checkout without a course shows the empty state`)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **public site › unknown course slug renders the not-found page** (`specs/site.spec.ts:53 ›  › desktop › site.spec.ts › public site › unknown course slug renders the not-found page`)
  - console: Failed to load resource: the server responded with a status of 404 (Not Found)
- **public site › instructor page renders the profile or its empty state** (`specs/site.spec.ts:75 ›  › desktop › site.spec.ts › public site › instructor page renders the profile or its empty state`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **public site › navbar reaches every public section** (`specs/site.spec.ts:111 ›  › desktop › site.spec.ts › public site › navbar reaches every public section`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
  - console: In HTML, %s cannot be a descendant of <%s>.
This will cause a hydration error.%s <li> li 

  ...
    <ScrollAndFocusHandler segmentPath={[...]}>
      <InnerScrollAndFocusHandler segmentPath={[...]} focusAndScrollRef={{apply:true, ...}}>
        <ErrorBoundary errorComponent={undefined} errorStyles={undefined} errorScripts={undefined}>
          <LoadingBoundary loading={null}>
            <HTTPAc
  - console: <%s> cannot contain a nested %s.
See this log for the ancestor stack trace. li <li>
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- **public site › footer links and support address are present** (`specs/site.spec.ts:128 ›  › desktop › site.spec.ts › public site › footer links and support address are present`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **route smoke test › /instructor renders without errors** (`specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /instructor renders without errors`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **route smoke test › /login renders without errors** (`specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /login renders without errors`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **route smoke test › /register renders without errors** (`specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /register renders without errors`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **route smoke test › /checkout?course=go-from-zero renders without errors** (`specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /checkout?course=go-from-zero renders without errors`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
- **route smoke test › /checkout/result?status=paid renders without errors** (`specs/smoke.spec.ts:22 ›  › desktop › smoke.spec.ts › route smoke test › /checkout/result?status=paid renders without errors`)
  - console: Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - console: Base UI: A component that acts as a button expected a native <button> because the `nativeButton` prop is true. Rendering a non-<button> removes native button semantics, which can impact forms and accessibility. Use a real <button> in the `render` prop, or set `nativeButton` to `false`.
    at Button (webpack-internal:///(app-pages-browser)/./components/ui/button.tsx:59:87)
    at AuthActions (webp
