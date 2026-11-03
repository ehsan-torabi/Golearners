"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/section-head";
import { api } from "@/lib/api";

function CheckMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="mx-auto size-14 text-success-text" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="m7.5 12.5 3 3 6-7" />
    </svg>
  );
}

function CrossMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="mx-auto size-14 text-destructive-text" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

type Outcome = "loading" | "paid" | "failed" | "unknown";

function ResultInner() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const [outcome, setOutcome] = React.useState<Outcome>("loading");

  /* The outcome comes from the server's order record, never from the URL:
     a link that says "paid" must not be able to dress itself up as a
     successful payment. */
  React.useEffect(() => {
    if (!orderId) {
      setOutcome("unknown");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const order = await api<{ status: string }>(`/me/orders/${encodeURIComponent(orderId)}`);
        if (cancelled) return;
        setOutcome(order.status === "paid" ? "paid" : "failed");
      } catch {
        if (!cancelled) setOutcome("unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (outcome === "loading") {
    return (
      <Card className="reveal mx-auto max-w-md p-10 text-center">
        <Skeleton className="mx-auto h-14 w-14" aria-label="در حال بررسی نتیجهٔ پرداخت" />
        <p className="mt-4 text-sm leading-7 text-muted-foreground">در حال بررسی نتیجهٔ پرداخت…</p>
      </Card>
    );
  }

  if (outcome === "unknown") {
    return (
      <Card className="reveal mx-auto max-w-md p-10 text-center">
        <CrossMark />
        <h1 className="mt-4 font-semibold text-2xl">نتیجهٔ پرداخت مشخص نیست</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          سفارش را پیدا نکردیم یا نشست منقضی شده است. وضعیت سفارش را از بخش سفارش‌ها ببینید یا با پشتیبانی تماس بگیرید.
        </p>
        <ButtonLink href="/dashboard/orders" variant="outline" className="mt-6">
          سفارش‌های من
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card className="reveal mx-auto max-w-md p-10 text-center">
      {outcome === "paid" ? (
        <>
          <CheckMark />
          <h1 className="mt-4 font-semibold text-2xl">پرداخت با موفقیت انجام شد</h1>
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
          <h1 className="mt-4 font-semibold text-2xl">پرداخت انجام نشد</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            پرداخت ناموفق بود یا لغو شد. می‌توانی دوباره تلاش کنی یا با پشتیبانی تماس بگیری.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {orderId && (
              <ButtonLink href={`/checkout?order=${encodeURIComponent(orderId)}`} size="lg">
                تلاش مجدد برای پرداخت
              </ButtonLink>
            )}
            <ButtonLink href="/dashboard/orders" variant="outline" size="lg">
              سفارش‌های من
            </ButtonLink>
          </div>
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
