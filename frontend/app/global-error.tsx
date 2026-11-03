"use client";

import { THEME_INIT_SCRIPT } from "@/lib/theme";

/**
 * Root error boundary: catches failures in the root layout itself, so it
 * renders its own <html>/<body> (the app shell may be broken here).
 *
 * The app stylesheet may not have loaded, so this document carries its own
 * light and dark surfaces instead of relying on the shared tokens.
 */
const errorTheme = `
  html { --bg: #ffffff; --fg: #1c1f2b; --line: #e4e6f0; }
  html[data-theme="dark"] { --bg: #0b0d1c; --fg: #e6e8f2; --line: rgba(255, 255, 255, 0.12); }
  body {
    background: var(--bg);
    color: var(--fg);
    font-family: Vazirmatn, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  button { border: 1px solid var(--line); }
`;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: errorTheme }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "32rem" }}>
          <p style={{ fontSize: "3rem", fontWeight: 700, margin: 0 }}>۵۰۰</p>
          <h1 style={{ fontSize: "1.25rem", margin: "0.5rem 0" }}>خطایی رخ داد</h1>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.9, opacity: 0.75 }}>
            بارگذاری این صفحه با مشکل روبه‌رو شد. دوباره تلاش کنید.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            تلاش دوباره
          </button>
        </div>
      </body>
    </html>
  );
}
