export { cn } from "cn";

export type ClassValue = string | number | bigint | null | undefined | false | ClassValue[];

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert Latin digits to Persian: 1405 -> ۱۴۰۵ */
export function fa(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** Persian/Arabic-Indic digits back to Latin (parsing user input). */
export function en(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Thousands-separated Persian number: 12450000 -> ۱۲٬۴۵۰٬۰۰۰ */
export function faNumber(value: number): string {
  return fa(Math.round(value).toLocaleString("en-US")).replace(/,/g, "٬");
}

/** Percent with Persian digits: 18 -> ۱۸٪ */
export function faPercent(value: number, digits = 0): string {
  return `${fa(value.toFixed(digits))}٪`;
}

/** Watch time in Persian words: ۳ ساعت و ۱۲ دقیقه / ۴۵ ثانیه. */
export function faDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${fa(h)} ساعت و ${fa(m)} دقیقه`;
  if (m > 0) return `${fa(m)} دقیقه`;
  return `${fa(s)} ثانیه`;
}

/** Seconds -> «۰۳:۲۰» / «۱:۰۲:۰۰» for players and previews. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return fa(h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`);
}

/** Serialize JSON-LD so a `</script>` inside an admin title can never
    break out of the ld+json tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
