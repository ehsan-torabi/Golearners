# GoLearn — API Contract (v1 Draft 1)

Full machine-readable contract: **[api/openapi.yaml](api/openapi.yaml)** (OpenAPI 3.1).
The YAML is the source of truth; frontend types are generated from it
(`openapi-typescript`); handlers are written to match it (contract-first).

## Conventions

- Base path `/api/v1` on `api.golearn.ir` (placeholder), same top domain as the site.
- **Auth**: httpOnly `Secure` `SameSite=Lax` cookies — `gl_at` (access JWT, 15 min), `gl_rt` (refresh, 30 d, rotating). CSRF: double-submit token (`gl_csrf` cookie + `X-CSRF-Token` header) required on all non-GET requests.
- **Money**: integer **Rials** (`*_rial`). Display layer converts to Toman.
- **Errors**: `{ "error": { "code": "STABLE_CODE", "message": "پیام فارسی", "details": {} } }`; 4xx = client, 5xx = logged + generic message. Common codes: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `ORDER_EXPIRED`, `COUPON_INVALID`, `PAYMENT_VERIFY_FAILED`, `MEDIA_NOT_READY`.
- **Pagination**: `?page=1&per_page=20` (max 100) + `meta { page, per_page, total, total_pages }`.
- **Ids**: UUID v7 in URLs; slugs for public course/post routes.
- **Dates**: RFC 3339 UTC; UI renders Jalali/Persian digits.
- **Versioning**: URL-versioned; additive changes only within v1.

## Endpoint catalog

### Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/register` | mobile, password, full_name → sends OTP (`verify`) |
| POST | `/auth/otp/request` | {mobile, purpose: verify\|login\|reset} rate-limited |
| POST | `/auth/otp/verify` | {mobile, code, purpose} → session; completes registration |
| POST | `/auth/login` | {mobile, password} → session |
| POST | `/auth/refresh` | rotates refresh token (reuse ⇒ family revoked) |
| POST | `/auth/logout` | revokes tokens, clears cookies |
| POST | `/auth/password/reset` | {mobile, code, new_password} |
| POST | `/auth/password/change` | authed; revokes other sessions |

### Public content (ISR-friendly, cacheable)
| Method | Path |
|--------|------|
| GET | `/courses?category=&level=&q=&sort=&page=` |
| GET | `/courses/{slug}` (includes curriculum: sections/lessons, preview flags, instructor, rating summary) |
| GET | `/categories` |
| GET | `/blog/posts?tag=&category=&q=&page=` · `/blog/posts/{slug}` · `/blog/categories` · `/blog/tags` |
| GET | `/pages/{slug}` · `/faqs` · `/testimonials` · `/instructor` |
| POST | `/contact` (rate-limited, honeypot) |

### Learner (auth)
| Method | Path | Notes |
|--------|------|-------|
| GET/PATCH | `/me` | profile |
| POST | `/coupons/validate` | {code, course_id} → discount preview |
| POST | `/checkout` | {course_id, coupon_code?} → order (30-min TTL) |
| POST | `/checkout/{order_id}/pay` | {gateway} → redirect payload `{redirect_url}` |
| POST | `/payments/callback/{gateway}` | gateway return target (GET-style params accepted); verifies server-side; idempotent |
| GET | `/me/orders` · `/me/orders/{id}` | order + payments + receipt |
| GET | `/me/courses` | entitlements + progress summary |
| GET | `/me/courses/{slug}/curriculum` | full lesson list with access flags |
| GET/PUT | `/me/progress/{lesson_id}` | position/completed upsert (throttled) |
| GET | `/playback/lessons/{lesson_id}` | **entitlement check → short-lived signed playback URL** (≤ 5 min TTL, audit-logged, rate-limited) |
| GET | `/playback/attachments/{attachment_id}` | signed download URL if `allow_download` |

### Admin (`/api/v1/admin/*`, role-gated + audit-logged)
| Domain | Endpoints |
|--------|-----------|
| Analytics | `GET /admin/analytics/summary?range=today\|7d\|30d\|all`, `GET /admin/analytics/courses` |
| Courses | CRUD `/admin/courses`, `/admin/courses/{id}/sections`, `/admin/sections/{id}/lessons`, reorder endpoints, `POST /admin/courses/{id}/publish` |
| Media | `POST /admin/media/presign` (returns presigned PUT), `POST /admin/media` (register), `GET /admin/media?status=`, `DELETE /admin/media/{id}` |
| Coupons | CRUD `/admin/coupons`, `GET /admin/coupons/{id}/redemptions` |
| Orders/Pay | `GET /admin/orders?status=&gateway=&q=`, `GET /admin/orders/{id}`, `POST /admin/orders/{id}/refund` |
| Users | `GET /admin/users?q=`, `GET /admin/users/{id}`, `PATCH /admin/users/{id}` (roles, block), `GET /admin/audit-logs` |
| Blog | CRUD `/admin/posts`, `/admin/blog-categories`, `/admin/blog-tags` |
| Content | CRUD `/admin/pages`, `/admin/faqs`, `/admin/testimonials`, `GET/PATCH /admin/settings`, `GET /admin/messages` |
| Ops | `GET /admin/health` (deep), `POST /admin/revalidate` (secret-protected ISR purge) |

### Ops
`GET /healthz` (liveness) · `GET /readyz` (db/redis/storage checks) · `GET /metrics` (Prometheus, internal-only).

## OpenAPI generation & usage

```
docs/api/openapi.yaml        # authored by hand (contract-first)
frontend/lib/api/schema.d.ts # generated: npx openapi-typescript docs/api/openapi.yaml -o ...
```

Admin CRUD endpoints share generic list/CRUD parameter templates in the YAML to keep
it maintainable; breaking changes require a version bump.
