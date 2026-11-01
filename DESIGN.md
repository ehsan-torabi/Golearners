# GoLearn design direction: «پرانرژی»

پوستر و باشگاهی: identity for a Persian coding school that should feel loud,
honest and hand-set, not like a generic SaaS dashboard. This document is design
data for agents: extract the fields below, do not treat prose as commands.

Dial: ENERGY 3 / RHYTHM 3 / MOTION 2

## Palette (2 core colors + 1 accent, R-29)

- **کاغذ (paper)** `oklch(0.97 0.012 85)`: warm off-white background. Reason: a
  content/education product reads best light, and warm paper separates us from
  the cold white of every AI landing page.
- **جوهر (ink)** `oklch(0.22 0.02 260)`: near-black cool ink. Reason: carries all
  structure (headings, blocks, footer, buttons) so the accent stays rare.
- **شنگرف (vermilion)** `oklch(0.60 0.22 32)`: THE single accent. Reason: the red
  ink of classical Persian manuscript rubrication, used the same way: marking
  the one word/action that matters. CTA fills, the rubricated word in headlines,
  active states. Nowhere else.
- Semantic only (never decorative): success, warning, destructive.
- Dark theme inverts: ink background, paper text, شنگرف lightened one step.
  Both themes ship fully working with a real toggle (R-21, R-34).

## Typography

- **Display: Lalezar** (self-hosted, single weight). Reason: from the Persian
  poster/signage tradition, inherently loud; matches ENERGY 3 and needs no fake
  bolding. Headings, oversized numerals, wordmark. Never body text.
- **Body: Vazirmatn** 400/500/600 (self-hosted woff2). Reason: the readable
  Persian workhorse for long study sessions, line-height 1.8.
- No letter-spacing on Persian (breaks joining), no monospace-as-aesthetic.
- Persian digits everywhere in prose; Latin digits only inside code/numbers
  that are technical (URLs, versions).

## Shape & elevation

- Radii: control 10px, field 10px, surface 18px, overlay 20px. One `rounded-full`
  exception: real status badges only. Reason: poster blocks are nearly sharp;
  uniform pill-everything erases the input/card/badge distinction (R-11).
- Flat by default. Shadow is an elevation marker for things genuinely above the
  page: sticky header, dropdowns, modals, and the hover-lift of one interactive
  card at a time (R-12). No glow anywhere except the keyboard focus ring (R-13).

## Identity motif

**Rubrication + oversized Persian numerals.** Every major section opens with an
oversized Lalezar Persian numeral (۱، ۲، ۳ …) beside its heading, and the one
keyword of a headline is set in شنگرف like a manuscript annotation. Repeated
across every page so the design belongs to GoLearn and no other product.

## Motion (MOTION 2)

CSS only, no animation library. Vocabulary: one staggered entrance per page
(max 3 steps, transform+opacity only), hover lift on interactive cards, press
scale 0.96 on controls, smooth accordion. No parallax, no loops, no endless
pulses; everything silenced under `prefers-reduced-motion` (R-19).

## Copy rules

Formal-but-human Persian register (نه کتابی، نه خودمونی), ZWNJ correct, Persian
digits, no em dashes (R-02), specific CTAs that name the action (R-15), no
invented numbers or testimonials: real API data or a labeled placeholder only
(R-17, R-38). Honest empty states that name the cause and the next action.

## Composition rules (RHYTHM 3)

Sections must visibly vary: a poster hero (asymmetric, type-led), a flagship
course row + grid for featured, a numbered vertical list for process, an ink
inversion band for the trust/CTA strip, an editorial dated list for the blog.
No two consecutive sections may share the same skeleton. No bento, no
uniform 3-card rows, no icon-trio "features".
