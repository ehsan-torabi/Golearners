import type { JSONContent } from "@tiptap/react"

export type RichTextEditorOutput = {
  html: string
  json: JSONContent
}

export type RichTextEditorContent = string | JSONContent

export type RichTextEditorVariant = "simple" | "advanced"

const HTTP_URL_PATTERN = /^https?:\/\//i

export function isAllowedRichTextUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return HTTP_URL_PATTERN.test(trimmed)
  }
}

export function normalizeRichTextUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ""
  if (HTTP_URL_PATTERN.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function normalizeRichTextContent(
  content: RichTextEditorContent | undefined
): RichTextEditorContent | undefined {
  if (content === undefined || content === null) return undefined
  if (typeof content === "string") {
    const trimmed = content.trim()
    return trimmed.length === 0 ? "" : content
  }
  return content
}

export function richTextContentsEqual(
  a: RichTextEditorContent | undefined,
  b: string
): boolean {
  if (a === undefined) return b === "" || b === "<p></p>"
  if (typeof a === "string") return a === b
  return false
}
