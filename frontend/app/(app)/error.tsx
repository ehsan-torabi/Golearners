"use client";

import { ErrorPage, RetryButton } from "@/components/ui/error-page";

/** Error boundary for the dashboard/admin area. */
export default function AppError({
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
      body="بارگذاری این بخش با مشکل روبه‌رو شد. دوباره تلاش کنید یا به داشبورد برگردید."
      actions={<RetryButton onRetry={reset} />}
      className="mx-auto w-full max-w-2xl px-4"
    />
  );
}
