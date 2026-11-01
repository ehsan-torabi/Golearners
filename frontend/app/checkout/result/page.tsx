"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/section-head";

function CheckMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="mx-auto size-14 text-success" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" className="opacity-25" />
      <path d="m7.5 12.5 3 3 6-7" />
    </svg>
  );
}

function CrossMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="mx-auto size-14 text-destructive" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" className="opacity-25" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

function ResultInner() {
  const params = useSearchParams();
  const paid = params.get("status") === "paid";
  return (
    <Card className="reveal mx-auto max-w-md p-10 text-center">
      {paid ? (
        <>
          <CheckMark />
          <h1 className="mt-4 font-display text-2xl">پرداخت با موفقیت انجام شد</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            دسترسی شما به دوره فعال شد؛ همین حالا می‌توانی شروع کنی.
          </p>
          <ButtonLink href="/dashboard" className="mt-6" size="lg">
            رفتن به داشبورد
          </ButtonLink>
        </>
      ) : (
        <>
          <CrossMark />
          <h1 className="mt-4 font-display text-2xl">پرداخت انجام نشد</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            پرداخت ناموفق بود یا لغو شد. می‌توانی دوباره تلاش کنی یا با پشتیبانی تماس بگیری.
          </p>
          <ButtonLink href="/courses" variant="outline" className="mt-6" size="lg">
            بازگشت به دوره‌ها
          </ButtonLink>
        </>
      )}
    </Card>
  );
}

export default function CheckoutResultPage() {
  return (
    <React.Suspense fallback={<Skeleton className="mx-auto h-72 max-w-md" />}>
      <ResultInner />
    </React.Suspense>
  );
}

export const dynamic = "force-dynamic";
