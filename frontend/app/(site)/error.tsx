"use client";

import { ErrorPage, RetryButton } from "@/components/ui/error-page";

/** Error boundary for the public site: a crashed page offers a retry. */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      code="۵۰۰"
      title="خطایی رخ داد"
      body="بارگذاری این صفحه با مشکل روبه‌رو شد. دوباره تلاش کنید؛ اگر تکرار شد، بعداً برگردید."
      actions={<RetryButton onRetry={reset} />}
    />
  );
}
