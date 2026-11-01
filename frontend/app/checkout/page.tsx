"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/section-head";
import { ApiError, api, formatTomanFromRial, type Order } from "@/lib/api";
import { fa } from "@/lib/utils";

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("course") ?? "";
  const [coupon, setCoupon] = React.useState("");
  const [order, setOrder] = React.useState<Order | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [paying, setPaying] = React.useState<string | null>(null);

  const createOrder = React.useCallback(async () => {
    if (!slug) return;
    setError("");
    setBusy(true);
    try {
      // single-course lookup (the old page fetched 50 courses to find one)
      const detail = await api<{ course: { id: string; title: string } }>(
        `/courses/${encodeURIComponent(slug)}`,
      );
      const o = await api<Order>("/checkout", {
        method: "POST",
        body: JSON.stringify({ course_id: detail.course.id, coupon_code: coupon || undefined }),
      });
      setOrder(o);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در برقراری ارتباط");
    } finally {
      setBusy(false);
    }
  }, [slug, coupon]);

  React.useEffect(() => {
    void createOrder();
    // initial order creation does not depend on the coupon input
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  async function pay(gateway: "zarinpal" | "mock") {
    if (!order) return;
    setError("");
    setPaying(gateway);
    try {
      const res = await api<{ redirect_url: string }>(`/checkout/${order.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ gateway }),
      });
      window.location.href = res.redirect_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در برقراری ارتباط");
      setPaying(null);
    }
  }

  if (!slug) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center text-muted-foreground">
        دوره‌ای انتخاب نشده است؛ از صفحهٔ دوره خرید را شروع کن.
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="font-display text-3xl">تسویه حساب</h1>
      <Card className="p-8">
        {order ? (
          <div className="space-y-3 text-sm">
            {order.items.map((it) => (
              <div key={it.course_id} className="flex items-center justify-between gap-4">
                <span className="text-foreground">{it.title_snapshot}</span>
                <span className="shrink-0">{formatTomanFromRial(it.unit_price_rial)}</span>
              </div>
            ))}
            {order.discount_rial > 0 && (
              <div className="flex items-center justify-between text-success">
                <span>تخفیف</span>
                <span>{formatTomanFromRial(order.discount_rial)}</span>
              </div>
            )}
            <div className="border-t border-line pt-3">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">قابل پرداخت</span>
                <span className="font-display text-xl">{formatTomanFromRial(order.total_rial)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                مهلت پرداخت: {fa(Math.max(0, Math.round((new Date(order.expires_at).getTime() - Date.now()) / 60000)))} دقیقه
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3" aria-label="در حال آماده‌سازی سفارش">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <Field label="کد تخفیف" htmlFor="coupon" className="flex-1">
            <Input
              id="coupon"
              dir="ltr"
              placeholder="مثلاً WELCOME"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
          </Field>
          <Button variant="outline" className="mt-6" onClick={() => void createOrder()} loading={busy}>
            اعمال
          </Button>
        </div>

        {error && <Alert className="mt-4">{error}</Alert>}

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium">انتخاب درگاه پرداخت</p>
          <Button className="w-full" onClick={() => void pay("zarinpal")} disabled={busy || !order} loading={paying === "zarinpal"}>
            پرداخت با زرین‌پال
          </Button>
          <Button variant="outline" className="w-full" onClick={() => void pay("mock")} disabled={busy || !order} loading={paying === "mock"}>
            درگاه آزمایشی
          </Button>
          <p className="text-center text-xs text-muted-foreground">درگاه آزمایشی فقط برای تست نصب است.</p>
        </div>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={<Skeleton className="mx-auto h-96 max-w-md" />}>
      <CheckoutInner />
    </React.Suspense>
  );
}
