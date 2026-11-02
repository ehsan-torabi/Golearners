# DESIGN.md — گوLearn «هزاران آموزش»

Direction set 2026-11-03. Reference the owner explicitly chose: faradars.org.
گوLearn keeps its own name, copy and data; it borrows the visual language:
white surfaces, one indigo primary, soft lavender hero bands, Vazirmatn,
rounded cards with hairline borders. No subscription product (owner decision).

**Dial: ENERGY 2 / RHYTHM 2 / MOTION 1.** A friendly marketplace, not an
agency showcase: calm sections with a few loud moments (hero, price card),
hover states only plus one reveal pass.

## Palette (2 core + 1 accent, R-29)

| Token | Light | Dark | Why |
| --- | --- | --- | --- |
| primary | `#4353EE` | `#7C89FF` | faradars-grade indigo; AA on white (5.7:1) for text and fills |
| primary tint | `#EEF0FF` | 16% indigo | chips, active states, covers |
| ink / foreground | `#1C1F2B` | near-white | slightly blue-black, warmer than pure black |
| muted foreground | `#5D6377` | 68% | body copy, AA (5.9:1) |
| border | `#E4E6F0` | `#2B2F55` | hairline, cool gray so cards read flat |
| accent (sparingly) | `#E5484D` red | `#F2555A` | discount badge and destructive only |
| semantic | success `#22C55E`, warning `#F0A417` | lifted | checks and ratings, never decoration |

The hero gradient (`--hero-from → --hero-to`, lavender to page white) is the
single brand gradient. It separates the hero/banner layer from content; it
never runs behind the whole page (R-01: hierarchy function).

## Shape and elevation

- Radius ladder: control/field 10px, surface/overlay 16px, tag 6px. Pill only
  for level chips (they are tags, not buttons) (R-11).
- Cards sit flat on white with a hairline border. Shadow is an elevation
  marker: `--depth-raise` on hover or the sticky buy card, `--depth-pop` for
  overlays. Nothing else floats (R-12).

## Typography

Vazirmatn 400/500/600 only, self-hosted. Persian-first body at 14px/1.66.
Headings 600 with tight leading. Latin fragments (Go, Python, MSP) inherit the
same face; numerals render as Persian digits via `fa()` helpers.

## Motion

200ms ease transitions on color/transform only, `translate-y-px` press.
One reveal pass on page entry (`.reveal`), no loops, no parallax
(MOTION 1; `prefers-reduced-motion` flattens everything).

## Voice

Specific and honest: «دیدن دوره‌ها», «ادامه یادگیری», «ورود برای خرید».
No invented statistics, testimonials or campaign banners; numbers come from
the API or do not render (R-17/R-38).
