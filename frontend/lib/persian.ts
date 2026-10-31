/** Iranian mobile formatting (subset of the VibeFarsi persian module). */
import { fa } from "./utils";

export { fa };

export function normalizeIranMobile(input: string): string {
  let d = input.replace(/[۰-۹]/g, (ch) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(ch)));
  d = d.replace(/\D/g, "");
  if (d.startsWith("0098")) d = d.slice(4);
  else if (d.startsWith("98") && d.length > 10) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

/** «912 345 6789» shown in Persian digits, always LTR. */
export function formatIranMobile(input: string): string {
  const d = normalizeIranMobile(input);
  return fa([d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(" "));
}
