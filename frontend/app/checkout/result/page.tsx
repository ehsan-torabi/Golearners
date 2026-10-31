"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function ResultInner() {
  const params = useSearchParams();
  const paid = params.get("status") === "paid";
  return (
    <Card className="mx-auto max-w-md p-10 text-center">
      {paid ? (
        <>
          <CheckCircle2 className="mx-auto size-12 text-success" strokeWidth={1.5} aria-hidden />
          <h1 className="mt-4 font-display text-xl">پرداخت با موفقیت انجام شد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            دسترسی شما به دوره فعال شد — هم‌اکنون می‌توانید شروع کنید.
          </p>
          <ButtonLink href="/dashboard" className="mt-6" size="lg">
            رفتن به داشبورد
          </ButtonLink>
        </>
      ) : (
        <>
          <XCircle className="mx-auto size-12 text-destructive" strokeWidth={1.5} aria-hidden />
          <h1 className="mt-4 font-display text-xl">پرداخت انجام نشد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            پرداخت ناموفق بود یا لغو شد. می‌توانید دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.
          </p>
          <ButtonLink href="/courses" variant="secondary" className="mt-6" size="lg">
            بازگشت به دوره‌ها
          </ButtonLink>
        </>
      )}
    </Card>
  );
}

export default function CheckoutResultPage() {
  return (
    <React.Suspense fallback={null}>
      <ResultInner />
    </React.Suspense>
  );
}

export const dynamic = "force-dynamic";
