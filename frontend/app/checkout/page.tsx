"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
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

  const createOrder = React.useCallback(async () => {
    if (!slug) return;
    setError("");
    setBusy(true);
    try {
      const courses = await api<{ data: { id: string; slug: string }[] }>(
        `/courses?per_page=50`,
      );
      const course = courses.data.find((c) => c.slug === decodeURIComponent(slug));
      if (!course) throw new ApiError(404, "NOT_FOUND", "دوره پیدا نشد.");
      const o = await api<Order>("/checkout", {
        method: "POST",
        body: JSON.stringify({ course_id: course.id, coupon_code: coupon || undefined }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function applyCoupon() {
    await createOrder();
  }

  async function pay(gateway: "zarinpal" | "digipay" | "mock") {
    if (!order) return;
    setError("");
    setBusy(true);
    try {
      const res = await api<{ redirect_url: string }>(`/checkout/${order.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ gateway }),
      });
      window.location.href = res.redirect_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در برقراری ارتباط");
      setBusy(false);
    }
  }

  if (!slug) {
    return <Card className="mx-auto max-w-md p-8 text-center text-muted-foreground">دوره‌ای انتخاب نشده است.</Card>;
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Card className="p-8">
        <h1 className="font-display text-lg">تسویه حساب</h1>
        {order ? (
          <div className="mt-5 space-y-3 text-sm">
            {order.items.map((it) => (
              <div key={it.course_id} className="flex items-center justify-between">
                <span className="text-foreground">{it.title_snapshot}</span>
                <span>{formatTomanFromRial(it.unit_price_rial)}</span>
              </div>
            ))}
            {order.discount_rial > 0 && (
              <div className="flex items-center justify-between text-success">
                <span>تخفیف</span>
                <span>{formatTomanFromRial(order.discount_rial)}</span>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>قابل پرداخت</span>
                <span>{formatTomanFromRial(order.total_rial)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                مهلت پرداخت: {fa(Math.max(0, Math.round((new Date(order.expires_at).getTime() - Date.now()) / 60000)))} دقیقه
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">{busy ? "در حال آماده‌سازی…" : "—"}</p>
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
          <Button variant="secondary" className="mt-6" onClick={applyCoupon} disabled={busy}>
            اعمال
          </Button>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium">انتخاب درگاه پرداخت</p>
          <Button className="w-full" onClick={() => pay("zarinpal")} disabled={busy || !order}>
            <ShieldCheck className="size-4" strokeWidth={1.5} aria-hidden />
            پرداخت با زرین‌پال
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => pay("mock")} disabled={busy || !order}>
            درگاه آزمایشی (تست)
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={null}>
      <CheckoutInner />
    </React.Suspense>
  );
}
