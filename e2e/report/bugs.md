# GoLearn — E2E bug report

Generated 2026-11-01T23:31:57.813Z · 23s · undefined passed · undefined failed · undefined skipped · undefined flaky (undefined total)

Every entry below is reproducible with `cd e2e && bunx playwright test <test file>`.

## Index

| ID | Severity | Area | Title |
|----|----------|------|-------|
| BUG-001 | major | route smoke test | /courses renders without errors |
| BUG-002 | major | route smoke test | /courses/go-from-zero renders without errors |
| BUG-003 | major | route smoke test | /blog renders without errors |
| BUG-004 | major | route smoke test | /contact renders without errors |

## BUG-001 · /courses renders without errors

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

**Screenshot:** `report/artifacts/smoke-route-smoke-test-courses-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/smoke-route-smoke-test-courses-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/smoke-route-smoke-test-courses-renders-without-errors-desktop/trace.zip`)

## BUG-002 · /courses/go-from-zero renders without errors

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

**Screenshot:** `report/artifacts/smoke-route-smoke-test-cou-8019c-zero-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/smoke-route-smoke-test-cou-8019c-zero-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/smoke-route-smoke-test-cou-8019c-zero-renders-without-errors-desktop/trace.zip`)

## BUG-003 · /blog renders without errors

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

**Screenshot:** `report/artifacts/smoke-route-smoke-test-blog-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/smoke-route-smoke-test-blog-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/smoke-route-smoke-test-blog-renders-without-errors-desktop/trace.zip`)

## BUG-004 · /contact renders without errors

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

**Screenshot:** `report/artifacts/smoke-route-smoke-test-contact-renders-without-errors-desktop/test-failed-1.png`

**Trace:** `report/artifacts/smoke-route-smoke-test-contact-renders-without-errors-desktop/trace.zip` (open with `bunx playwright show-trace report/artifacts/smoke-route-smoke-test-contact-renders-without-errors-desktop/trace.zip`)
