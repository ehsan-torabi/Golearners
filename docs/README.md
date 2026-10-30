# GoLearn — Design & Engineering Docs

Persian-first, RTL e-learning platform for a personal programming instructor.
Phase 1 deliverable: discovery & design. Implementation starts after review/approval.

## Reading order

| # | Doc | Contents |
|---|-----|----------|
| 1 | [01-srs.md](01-srs.md) | Goals, personas, user stories + acceptance criteria, FR/NFR, launch DoD, out-of-scope |
| 2 | [02-architecture.md](02-architecture.md) | Stack decisions, container diagram, repo layout, ADR-lite table, config/secrets |
| 3 | [03-domain-model.md](03-domain-model.md) | ERD, entity notes, invariants, state machines |
| 4 | [04-api-contract.md](04-api-contract.md) | API conventions + endpoint catalog; full contract in [api/openapi.yaml](api/openapi.yaml) |
| 5 | [05-payments.md](05-payments.md) | Gateway abstraction, ZarinPal (official-spec) & DigiPay (TODO-marked) adapters, payment flow, reconciliation, refunds |
| 6 | [06-media-security.md](06-media-security.md) | VOD adapter design, upload → transcode → signed playback, anti-hotlinking, download rules |
| 7 | [07-threat-model.md](07-threat-model.md) | Assets, trust boundaries, STRIDE table, abuse cases |
| 8 | [08-coding-standards.md](08-coding-standards.md) | Go & TS standards, layering rules, error/logging conventions, git/DoD |
| 9 | [09-testing-strategy.md](09-testing-strategy.md) | Test pyramid, payment/authz/playback scenario matrix, CI pipeline |
| 10 | [10-roadmap.md](10-roadmap.md) | Implementation phases with exit criteria and review gates |

## Status

| Doc | Status |
|-----|--------|
| All Phase 1 docs | **Draft 1 — awaiting review** |

## Decisions locked with owner (2026-10-30)

- Primary payment rails: **ZarinPal + DigiPay** (SnappPay scaffolded per original brief, built after).
- Course access: **lifetime** (schema keeps `expires_at` for the future).
- Learner auth: **mobile + password**, OTP for verification & reset.
- **Multi-instructor later**: `instructor_id` kept on content now.
- Hosting: **undecided** → provider-agnostic design (Docker, S3-compatible storage, adapter-per-provider).
- Video: **managed VOD** (e.g., ArvanCloud) behind a `VideoPlatform` adapter + local dev adapter.
- **Monorepo** (`backend/`, `frontend/`, `docs/`, `deploy/`).
- UI: **Material 3 tokens + Apple-style motion**, Vazirmatn, RTL-first.
