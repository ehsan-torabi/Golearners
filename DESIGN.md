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
| primary | `#4353EE` | `#8B93F2` | faradars-grade indigo; AA on white (5.7:1) for text and fills. Dark is the same hue desaturated one step, so it does not glow against a near-black page (6.9:1) |
| primary tint | `#EEF0FF` | 16% indigo | chips, active states, covers |
| ink / foreground | `#1C1F2B` | `#E6E8F2` | slightly blue-black, warmer than pure black. Dark is off-white, never pure white: pure white on a dark page blooms |
| muted foreground | `#5D6377` | `#9AA0BD` | body copy, AA (5.9:1 light, 6.8:1 dark on a card) |
| border | `#E4E6F0` | 12% white | hairline, cool gray so cards read flat. Dark hairlines are low-opacity white, so one value reads the same on every surface of the ladder |
| accent (sparingly) | `#D13A40` red | `#E8636A` | discount badge and destructive only. The light hex is one AA step below the brand `#E5484D`, which fails a white 12px label at 3.9:1 |
| semantic | success `#22C55E`, warning `#F0A417` | lifted and desaturated | checks and ratings, never decoration. Dark semantics are desaturated 10-20% so they sit on a dark page without vibrating |

The hero gradient (`--hero-from → --hero-to`, lavender to page white) is the
single brand gradient. It separates the hero/banner layer from content; it
never runs behind the whole page (R-01: hierarchy function).

## Dark mode

The dark palette is a translation of the light one, not an inversion.

- **Elevation is a ladder of lighter shades**, never shadows (a shadow does
  not read on a dark page): page `#0B0D1C` → card `#141830` → subtle fill
  `#1A1E3C` → overlay `#21264A` → hover fill `#272D55`.
- **Text is off-white** `#E6E8F2`, not pure white, and never a translucent
  white: an alpha foreground changes contrast with every surface it lands
  on.
- **Brand colours desaturate 10-20%** in dark. The indigo, green, amber and
  red are the same hues, one step down in chroma.
- **Borders are 12% white**, one value for every surface of the ladder.
- **Imagery is dimmed to 94%** so a cover sits in the page instead of
  glaring against it (`.media-dim`).
- **A modal veil is a token** (`--scrim`), because a black 10% scrim is
  invisible on a dark page.
- The theme follows `prefers-color-scheme` until the visitor picks a mode;
  an explicit pick then wins. The toggle announces the new mode to screen
  readers, and the swap animates the tokens once.

Run `bun run check:contrast` in `frontend/` after touching either palette.

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
