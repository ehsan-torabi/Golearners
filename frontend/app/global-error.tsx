"use client";

/**
 * Root error boundary: catches failures in the root layout itself, so it
 * renders its own <html>/<body> (the app shell may be broken here).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "inherit",
          background: "var(--background, #fff)",
          color: "var(--foreground, #111)",
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
              border: "1px solid currentColor",
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
