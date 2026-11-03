/**
 * WCAG contrast check for the two palettes in app/globals.css.
 *
 * The palettes are read out of the stylesheet, so this check stays true as
 * the colours move: change a token, run the script, see what broke.
 *
 *   bun run check:contrast
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "app/globals.css"), "utf8");

/** Pull one declaration block out of the stylesheet. */
function block(selector) {
  const at = css.indexOf(selector);
  if (at < 0) throw new Error(`selector not found: ${selector}`);
  const open = css.indexOf("{", at);
  const close = css.indexOf("}", open);
  const body = css.slice(open + 1, close);
  const vars = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[name] = value.trim();
  }
  return vars;
}

const themes = {
  light: block(":root {"),
  dark: block('[data-theme="dark"] {'),
};

/** "#rrggbb" | "#rgb" | "rgb(r g b)" | "rgba(r, g, b, a)" -> [r,g,b,a] */
function parse(color) {
  const value = color.trim();
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
      1,
    ];
  }
  const nums = value.match(/[\d.]+/g)?.map(Number) ?? [];
  const [r, g, b] = nums;
  const a = nums.length > 3 ? nums[3] : 1;
  return [r, g, b, a];
}

/** Flatten a translucent colour onto the surface it sits on. */
function over(color, base) {
  const [r, g, b, a] = parse(color);
  if (a >= 1) return [r, g, b];
  const [br, bg, bb] = base;
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)];
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/* [foreground token, background token, minimum ratio, note]
 * The background may be a translucent token: it is flattened onto the page
 * surface first, which is how it actually renders. */
const CHECKS = [
  ["--foreground", "--background", 4.5, "body copy on the page"],
  ["--foreground", "--card", 4.5, "body copy on a card"],
  ["--foreground", "--popover", 4.5, "body copy in a menu"],
  ["--muted-foreground", "--background", 4.5, "secondary copy on the page"],
  ["--muted-foreground", "--card", 4.5, "secondary copy on a card"],
  ["--muted-foreground", "--muted", 4.5, "secondary copy on a muted fill"],
  ["--primary", "--background", 4.5, "primary link text"],
  ["--primary", "--primary-tint", 4.5, "primary text on a primary tint"],
  ["--primary-foreground", "--primary", 4.5, "label on a primary button"],
  ["--accent-strong", "--background", 4.5, "active nav link"],
  ["--accent-strong", "--card", 4.5, "active nav link on a card"],
  ["--destructive-foreground", "--destructive", 4.5, "label on a destructive chip"],
  ["--destructive-text", "--background", 4.5, "destructive text on the page"],
  ["--destructive-text", "--destructive-bg", 4.5, "destructive text in an alert"],
  ["--success-text", "--background", 4.5, "success text on the page"],
  ["--success-text", "--success-bg", 4.5, "success text in an alert"],
  ["--warning-text", "--background", 4.5, "warning text on the page"],
  ["--warning-text", "--warning-bg", 4.5, "warning text in an alert"],
  ["--info-text", "--background", 4.5, "info text on the page"],
  ["--invert-foreground", "--invert", 4.5, "label on an inverted band"],
  ["--ring", "--background", 3, "focus ring against the page"],
  ["--ring", "--card", 3, "focus ring against a card"],
];

let failures = 0;
const rows = [];

for (const [name, vars] of Object.entries(themes)) {
  const page = over(vars["--background"], [255, 255, 255]);
  for (const [fgToken, bgToken, min, note] of CHECKS) {
    const fgRaw = vars[fgToken];
    const bgRaw = vars[bgToken];
    if (!fgRaw || !bgRaw) {
      rows.push([name, `${fgToken} on ${bgToken}`, "n/a", `missing token`]);
      failures += 1;
      continue;
    }
    const bgBase = bgToken === "--background" ? page : over(bgRaw, page);
    const fg = over(fgRaw, bgBase);
    const bg = bgBase;
    const value = ratio(fg, bg);
    const pass = value + 0.005 >= min;
    if (!pass) failures += 1;
    rows.push([
      name,
      `${fgToken} on ${bgToken}`,
      `${value.toFixed(2)}:1 (min ${min})`,
      pass ? `ok — ${note}` : `FAIL — ${note}`,
    ]);
  }
}

const width = Math.max(...rows.map((r) => r[1].length));
for (const [name, pair, value, status] of rows) {
  console.log(`${name.padEnd(5)} ${pair.padEnd(width)} ${value.padEnd(20)} ${status}`);
}

console.log(
  failures === 0
    ? `\nPASS: ${rows.length} contrast checks clear WCAG AA`
    : `\nFAIL: ${failures} of ${rows.length} contrast checks below the minimum`,
);
process.exit(failures === 0 ? 0 : 1);
