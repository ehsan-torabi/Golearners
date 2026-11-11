const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"

export type PersianDigitsMode = boolean | "auto"

export type FormatPersianNumberOptions = {
  style?: "decimal" | "percent"
  useGrouping?: boolean
}

/**
 * Canonicalize digit characters to ASCII Latin digits.
 * Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits, maps ٫ → ., − → -.
 * Does not alter letters or other punctuation.
 */
export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/\u066B/g, ".") // Arabic decimal separator
    .replace(/\u2212/g, "-") // minus sign
}

/** Parse a number a user typed or pasted into a form field: Persian or
    Latin digits, grouping separators (٬ ,) and stray spaces stripped.
    Returns NaN when nothing numeric remains — callers must validate. */
export function parseUserNumber(value: string): number {
  const cleaned = normalizeDigits(value).replace(/[,\u066C\s\u00A0]/g, "")
  return cleaned === "" ? NaN : Number(cleaned)
}

/**
 * Map ASCII digits to Persian digits only (no grouping).
 * Safe for live Input typing / OTP characters.
 */
export function toPersianDigits(value: string | number): string {
  return normalizeDigits(String(value)).replace(
    /\d/g,
    (digit) => PERSIAN_DIGITS[Number(digit)]!
  )
}

/**
 * Presentation formatter for numeric labels (prices, counts, percentages).
 * Not for live Input typing (use toPersianDigits there to preserve caret).
 */
export function formatPersianNumber(
  value: number | string,
  options: FormatPersianNumberOptions = {}
): string {
  const { style = "decimal", useGrouping = true } = options
  const normalized =
    typeof value === "number" ? value : Number(normalizeDigits(String(value)))

  if (!Number.isFinite(normalized)) {
    return toPersianDigits(String(value))
  }

  return new Intl.NumberFormat("fa-IR", {
    style,
    useGrouping,
    maximumFractionDigits: style === "percent" ? 2 : 20,
  }).format(style === "percent" ? normalized / 100 : normalized)
}

/**
 * Semantic numeric inputs — NOT tel/email/password/text.
 * Used for FormData hidden-name behavior and number→text coercion.
 */
export function isNumericInputHint(type?: string, inputMode?: string): boolean {
  if (inputMode === "numeric" || inputMode === "decimal") {
    return true
  }
  return type === "number"
}

/**
 * Input types that must keep Latin digits (credentials / technical).
 * `tel` is NOT locked — phone numbers may show Persian digits with dir="ltr".
 */
function isLatinLockedInputType(type?: string): boolean {
  switch (type) {
    case "email":
    case "password":
    case "url":
    case "file":
    case "hidden":
    case "checkbox":
    case "radio":
    case "button":
    case "submit":
    case "reset":
    case "image":
    case "color":
    case "range":
    case "date":
    case "datetime-local":
    case "month":
    case "week":
    case "time":
      return true
    default:
      return false
  }
}

export function readLocaleContext(
  element: HTMLElement | null,
  props: { dir?: string; lang?: string; locale?: string }
): { dir: string | null; lang: string | null; locale: string | null } {
  // Explicit locale/lang props win. A bare `dir` prop must NOT wipe inherited
  // lang — direction and digit style are independent (phone LTR + Persian).
  let dir: string | null = props.dir ?? null
  let lang: string | null = props.lang ?? null
  const locale: string | null = props.locale ?? null

  if (locale != null && lang != null && dir != null) {
    return { dir, lang, locale }
  }

  let node: HTMLElement | null = element
  while (node && (dir == null || lang == null)) {
    if (!lang) {
      lang = node.getAttribute("lang") || node.getAttribute("data-lang")
    }

    if (!dir && node.hasAttribute("dir")) {
      dir = node.getAttribute("dir")
    }

    if (dir && lang) {
      break
    }

    node = node.parentElement
  }

  // Prefer container dir over <html lang="en"> on English shell + RTL preview.
  if (!dir && typeof document !== "undefined") {
    dir = document.documentElement.getAttribute("dir")
  }

  return { dir, lang, locale }
}

function isPersianLocaleContext(options: {
  dir?: string | null
  lang?: string | null
  locale?: string | null
}): boolean {
  const locale = (options.locale ?? "").toLowerCase()
  if (locale.startsWith("en")) return false
  if (locale.startsWith("fa")) return true

  const lang = (options.lang ?? "").toLowerCase()
  if (lang.startsWith("en")) return false
  if (lang.startsWith("fa") || lang.startsWith("ar") || lang.startsWith("he")) {
    return true
  }

  // Direction alone does not select Latin digits. FarsiUI defaults to Persian
  // unless English is explicit via locale/lang above.
  return true
}

/**
 * Whether a field should show Persian digits in the current locale.
 * Direction (`dir`) is independent of digit style — only explicit opt-out /
 * English locale / latin-locked input types disable conversion.
 */
export function resolvePersianDigitsEnabled(options: {
  persianDigits?: PersianDigitsMode
  type?: string
  inputMode?: string
  dir?: string | null
  lang?: string | null
  locale?: string | null
  "data-persian-digits"?: string | null
}): boolean {
  const { persianDigits = "auto", type, dir, lang, locale } = options

  if (options["data-persian-digits"] === "false") {
    return false
  }
  if (options["data-persian-digits"] === "true") {
    return true
  }

  if (persianDigits === true) {
    return true
  }
  if (persianDigits === false) {
    return false
  }

  if (isLatinLockedInputType(type)) {
    return false
  }

  return isPersianLocaleContext({ dir, lang, locale })
}
