# GoLearn — Software Requirements Specification (v1.0 Draft 1)

Date: 2026-10-30 · Status: awaiting review · Owner: instructor (Ehsan)

## 1. Overview

GoLearn (گولرن) is a Persian-first, RTL e-commerce + LMS website where a personal
programming instructor sells self-produced video courses. Visitors browse courses and
blog content; learners register, pay with Iranian payment rails (ZarinPal, DigiPay),
and stream protected videos. The owner manages everything (content, media, orders,
users, SEO) from an advanced admin panel.

### Goals

1. Sell programming courses online with Iranian payment rails, securely.
2. Protect paid video content (no public URLs, no free hotlinking).
3. Win organic Persian search traffic (technical SEO + blog).
4. Give the owner full operational control via the admin panel.
5. Stay maintainable by one developer: simple, explicit, well-tested code.

### Non-goals (v1)

Mobile apps · multi-instructor marketplace UI (schema-ready only) · live classes ·
community forum/comments · multi-currency · non-Persian localization ·
e-Namad/سامانه مودیان integration (placeholders only) · email marketing.

## 2. Personas

| Persona | Who | Needs |
|---------|-----|-------|
| **P1 دانجو** (learner) | 18–35, Persian-speaking, mobile-first, buys with ZarinPal/DigiPay | Judge a course fast (preview, curriculum, reviews), pay easily, watch on phone/desktop, resume where left off |
| **P2 استاد** (instructor/owner) | The instructor; produces courses and blog posts | Publish courses/lessons, set pricing & coupons, see sales analytics, manage refunds |
| **P3 ادمین** (admin) | Owner initially; trusted helper later | Manage users/roles/orders/payments/content/SEO, audit sensitive actions |

## 3. User stories & acceptance criteria

Priority: **P0** = launch-blocking, **P1** = should ship in v1, **P2** = nice-to-have.

### Epic A — Auth & account

- **US-A1 (P0) Register with mobile** — As a visitor, I register with my mobile number, name, and password.
  - AC: Iranian mobile format (`09xxxxxxxxx`) validated; 6-digit OTP sent on submit; account is `pending_verification` until OTP verified; OTP expires in 2 min, max 5 attempts, resend allowed after 60 s; duplicate mobile returns a clear error (no account enumeration in messages).
- **US-A2 (P0) Login with password** — As a learner, I log in with mobile + password.
  - AC: Argon2id hash verified; on failure a generic error; per-IP and per-account rate limits (e.g., 10/min, lockout backoff after repeated failures); session established via httpOnly Secure cookies.
- **US-A3 (P0) OTP login** — As a learner, I can log in with an SMS code instead of a password.
  - AC: same OTP policy as US-A1; purpose-scoped codes (`login` ≠ `reset` ≠ `verify`); single use.
- **US-A4 (P0) Forgot/reset password** — As a learner, I reset a forgotten password via SMS OTP.
  - AC: OTP verified → new password accepted (min 8 chars, checked against a small breached/weak list); all existing refresh tokens revoked; confirmation SMS.
- **US-A5 (P1) Session refresh & logout** — Sessions stay alive safely.
  - AC: access token 15 min + rotating refresh token (30 d, single-use, hashed at rest); refresh-token reuse triggers revocation of the whole family; logout invalidates both and clears cookies.
- **US-A6 (P1) Profile management** — As a learner, I view/edit name, email (optional), and change password.
  - AC: password change requires current password and revokes other sessions.

### Epic B — Public catalog & course pages

- **US-B1 (P0) Course catalog** — As a visitor, I browse/search published courses with filters (category, level) and sorting (newest, popular, price).
  - AC: SSR page, Persian text, paginated; unpublished/draft courses never appear for non-admins; Core Web Vitals green.
- **US-B2 (P0) Course detail page** — As a visitor, I see title, rich description, curriculum (sections/lessons), prerequisites, instructor bio, price with any active discount, ratings, FAQ snippet, and a purchase CTA.
  - AC: preview-marked lessons play without purchase; CTA for enrolled users becomes "ادامه دوره"; page emits `Course` + `BreadcrumbList` JSON-LD; canonical URL; OG/Twitter cards.
- **US-B3 (P0) Instructor introduction page** — As a visitor, I read the instructor's bio, skills, social links, and testimonials.
  - AC: static/ISR page; `Person` JSON-LD; linked from every course page.
- **US-B4 (P1) Reviews & ratings** — As an enrolled learner, I rate a course (1–5) with optional text.
  - AC: only entitled users can review (one per course, editable); reviews appear after admin approval; aggregate shown on course page.

### Epic C — Purchase & payments

- **US-C1 (P0) Direct checkout** — As a learner, I buy a course directly (single course per order in v1).
  - AC: order created server-side with price snapshot; already-owned course shows "درباره دوره" instead of buy CTA; order expires in 30 min if unpaid.
- **US-C2 (P0) Apply coupon** — As a learner, I enter a coupon code at checkout.
  - AC: validation returns discount amount + human-readable reason on failure (expired, exhausted, min-amount, scope); single-use coupons can't be reused; coupon usage counted atomically with order payment.
- **US-C3 (P0) Pay with ZarinPal/DigiPay** — As a learner, I choose a gateway and pay.
  - AC: payment initiated server-side with amount = order total; redirect to gateway; on return, backend verifies amount + status against the gateway API (never trusts query params alone); idempotent callbacks (verify code 101 treated as already-verified success); success grants entitlement and shows receipt.
- **US-C4 (P0) Payment failure handling** — If payment fails or the user abandons it, the system behaves sanely.
  - AC: `NOK`/failed verification marks payment `failed` and order stays `awaiting_payment` until expiry; retry creates a new payment attempt (orders keep attempt history); reconciliation job flags payments stuck > 1 h.
- **US-C5 (P1) Refund (admin-initiated)** — As the owner, I refund a paid order.
  - AC: ZarinPal reverse supported within 30-min window per official API; outside the window the refund is recorded as `manual` with notes; refund revokes entitlement (configurable); audit-logged.
- **US-C6 (P1) Order/payment history** — As a learner, I see my orders with status, gateway ref, amounts, and a printable receipt/invoice view.
  - AC: only the owner of the order can see it (IDOR-tested); amounts in Toman with Persian digits.

### Epic D — Learning experience

- **US-D1 (P0) Watch purchased course** — As an enrolled learner, I stream lessons via HLS.
  - AC: playback URL issued only after entitlement check; URL is short-lived (≤ 5 min) and tied to the lesson + user; player supports quality selection, playback speed, resume.
- **US-D2 (P0) Progress tracking** — My position and completion are saved.
  - AC: position saved every ~10 s + on pause/exit (debounced); "completed" when ≥ 90 % watched or marked manually; course progress % computed from completed lessons.
- **US-D3 (P1) Course player UX** — Curriculum sidebar, next/prev lesson, mark-complete, keyboard shortcuts.
  - AC: works on mobile and desktop; reduced-motion respected.
- **US-D4 (P2) Attachments** — If a lesson has downloadable PDFs, entitled users can download them via short-lived signed URLs.
  - AC: per-attachment download flag; videos are never downloadable in v1.
- **US-D5 (P1) Free preview lessons** — Lessons marked `is_preview` play for anyone.
  - AC: same signed-URL pipeline, entitlement check bypassed for previews only.

### Epic E — User dashboard

- **US-E1 (P0) My courses** — Grid of purchased courses with progress and continue CTA.
- **US-E2 (P0) Orders & payments** — List + detail as US-C6.
- **US-E3 (P1) Support/contact** — Authenticated user can send a message; sees prior thread status.
- **US-E4 (P1) Notifications** — In-app notices (payment success, refund) on dashboard; SMS used for critical transactional events only.

### Epic F — Admin panel

- **US-F1 (P0) Auth & RBAC** — Admin area gated by roles; `owner` > `admin` > `instructor` > `learner`.
  - AC: every admin route + API enforces role server-side; learners get 403/404; admin accounts use password + (P2) TOTP; active sessions list; audit log for sensitive actions (role change, price change, refund, publish, delete).
- **US-F2 (P0) Dashboard** — KPIs: revenue (today/7d/30d/total), orders, new users, top courses, recent payments, payment success rate.
  - AC: numbers reconcile with orders/payments tables; charts render fast with server aggregation.
- **US-F3 (P0) Course & curriculum management** — CRUD courses, sections, lessons (drag-order), publish/unpublish, SEO fields per course.
  - AC: slug uniqueness enforced with auto-suffix; publish requires ≥ 1 ready lesson; deleting a course with sales is soft-delete/archival only.
- **US-F4 (P0) Media management** — Upload videos (resumable, progress), see processing status, attach to lessons, replace, delete.
  - AC: upload via presigned URL direct-to-storage; status shown (uploaded → processing → ready/failed); failed uploads retryable; storage usage shown.
- **US-F5 (P0) Coupons** — CRUD with type (percent/fixed), window, usage caps, per-user cap, course scope, status.
- **US-F6 (P0) Orders/payments/refunds management** — List with filters, detail view, manual refund flow (US-C5), gateway-payload inspector for support.
- **US-F7 (P0) Users & roles** — Search users, view profile/purchases, change roles (owner-only for admin grants), block/unblock.
- **US-F8 (P1) Blog management** — CRUD posts with categories/tags, cover image, draft/publish, SEO fields, slug control.
- **US-F9 (P1) Site content** — Pages (about/FAQ/contact), testimonials, contact inbox, site settings (SEO defaults, socials, gateway enable/disable, maintenance mode).
- **US-F10 (P1) Audit log viewer** — Filterable audit trail of admin actions.

### Epic G — Blog & SEO

- **US-G1 (P0) Blog** — Category/tag-filterable post list, post page with related posts, author bio.
  - AC: `Article/BlogPosting` JSON-LD, canonical, OG cards, reading time, clean slugs (Persian slugs supported with proper encoding).
- **US-G2 (P0) Technical SEO** — sitemap.xml (courses/posts/categories, lastmod), robots.txt, canonical URLs, 301 for slug changes, structured data for Organization/Person/Course/Breadcrumb/Article.
  - AC: Search-Console-valid sitemap; no indexable duplicate URLs (trailing-slash + query canonicalization).
- **US-G3 (P1) Pages & FAQ** — Editable pages with proper headings, FAQ schema on FAQ page.

### Epic H — Trust & compliance

- **US-H1 (P1) Contact page** — Form with rate limiting + spam honeypot; messages land in admin inbox.
- **US-H2 (P2) Privacy page** — Persian privacy policy describing collected data (mobile, progress, payments) and retention.
- **US-H3 (P2) e-Namad placeholder** — Slot in footer for trust badges (integration deferred).

## 4. Functional requirements (by module)

| Module | Requirements (IDs) |
|--------|--------------------|
| Auth | Iranian mobile validation, Argon2id passwords, purpose-scoped OTP, JWT access (15 min) + rotating refresh (30 d) in httpOnly `SameSite=Lax` cookies, CSRF protection on mutations, session/refresh revocation, RBAC roles, account lockout backoff |
| Catalog | Published-only visibility, category/level filters, sort, search (Postgres FTS on title/summary, `fa` config), pagination |
| Course | Sections/lessons ordered, preview flags, price + active discount display, curriculum API, enrollment gate |
| Orders/Pay | Order with price snapshot, 30-min expiry, coupon engine (atomic usage), gateway abstraction + ZarinPal/DigiPay/mock, idempotent verify, amount validation, attempt history, reconciliation job, refunds |
| Media/Playback | Presigned uploads, transcode status, entitlement-checked playback endpoint, signed short-lived URLs, audit of issuance, download rules per attachment |
| Progress | Upsert position, completion rule, course progress % |
| Admin | Analytics aggregates, full CRUD domains, media manager, order/refund tools, users/roles, settings, audit log |
| Blog | Posts/categories/tags, draft→publish, related posts, RSS (P2) |
| SEO | Metadata API everywhere, JSON-LD, sitemap/robots, ISR + on-demand revalidation on publish, Persian slug support |
| Infra | Health/ready endpoints, structured logs, metrics, backups, rate limiting, audit logging |

## 5. Non-functional requirements

**Security** — OWASP ASVS-aligned: input validation everywhere (go-playground/validator + zod at boundaries), parameterized SQL only, output encoding (React default), CSRF (SameSite=Lax + token for admin mutations), rate limits (login/OTP/checkout/contact/playback-issuance), secure headers (CSP, HSTS, X-Frame-Options: DENY, Referrer-Policy), Argon2id (m=64 MB, t=3, p=2), secrets only via env, no PII in logs, audit trail, nightly encrypted backups (RPO 24 h / RTO 4 h).

**Performance** — SSR TTFB p95 < 800 ms on a typical Iranian 4G profile; LCP < 2.5 s; playback start < 2 s; admin list queries < 300 ms; N+1-free data access; images via `next/image` + AVIF/WebP.

**Reliability** — Single-node Docker Compose acceptable at launch; `healthz`/`readyz`; graceful shutdown; migration up/down tested; payment state never lost (event rows persisted before external calls).

**Accessibility** — WCAG 2.1 AA: keyboard-complete, focus-visible, contrast ≥ 4.5:1, `prefers-reduced-motion` respected, Persian labels with logical RTL properties.

**Maintainability** — Clean layering (domain → service → transport/adapter), DI by constructor, OpenAPI-first contract, ≥ 80 % coverage on domain/services, conventional commits, ADRs for big choices.

**Display conventions** — Currency stored as **Rials (integer)**, displayed as Toman with Persian digits; dates stored UTC, displayed Jalali.

## 6. Launch definition of done

1. All P0 stories pass their ACs (automated where possible, manual checklist otherwise).
2. E2E happy path green on sandbox gateways: register → buy (mock + ZarinPal sandbox) → watch → progress.
3. Authz matrix tests pass (role × endpoint); IDOR tests on orders/playback/progress.
4. Security checklist (docs/07 §5) signed off; secrets scan clean; deps scanned.
5. Lighthouse ≥ 90 (Performance/SEO/Best Practices/Accessibility) on home, course, blog post.
6. Sitemap/robots/JSON-LD validated; redirects working.
7. Runbook + `.env.example` + deploy notes written; backup/restore drill performed once.

## 7. Assumptions & open questions (confirm at review)

| # | Assumption | Confirm? |
|---|-----------|----------|
| 1 | Domain placeholder `golearn.ir`; subdomains `api.` (backend), `cdn/media` via provider | yes |
| 2 | Admin panel is Persian-only | yes |
| 3 | SMS provider: adapter interface with **Kavenegar** first candidate + mock; credentials needed before launch | provider? |
| 4 | DigiPay adapter built against placeholder mapping until official merchant docs/credentials are provided | provide docs |
| 5 | SnappPay adapter: interface + scaffold in v1 (per original brief), completed after ZarinPal/DigiPay | ok? |
| 6 | VOD provider: ArvanCloud assumed; official API details needed for the real adapter (upload/ingest/token scheme) | provide account/docs |
| 7 | Single course per order (no cart) in v1; schema supports multi-item carts later | ok? |
| 8 | Course reviews moderated (approve before publish) | ok? |
| 9 | Email delivery (SMTP) optional in v1; SMS is the primary channel | ok? |
| 10 | Brand assets (logo, seed color for M3 theme) supplied by owner | provide assets |
