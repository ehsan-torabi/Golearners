"use client";

import * as React from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/section-head";
import { TrashIcon } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useSession } from "@/components/use-session";
import { useRouter } from "next/navigation";
import { ApiError, api, formatTomanFromRial } from "@/lib/api";
import { PayGateways, startPayment, type Gateway } from "@/components/site/pay-gateways";

interface CartRow {
  course_id: string;
  slug: string;
  title: string;
  price_rial: number;
  owned?: boolean;
  missing?: boolean;
}

export default function CartPage() {
  const { items, hydrated, remove, clear } = useCart();
  const { status, session } = useSession();
  const router = useRouter();
  const [rows, setRows] = React.useState<CartRow[]>([]);
  const [refreshing, setRefreshing] = React.useState(true);
  const [coupon, setCoupon] = React.useState("");
  const [appliedCode, setAppliedCode] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [paying, setPaying] = React.useState<Gateway | null>(null);

  // server refresh: the stored snapshot only seeds the view; prices and
  // ownership shown here come from the live course record
  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    const next = await Promise.all(
      items.map(async (it) => {
        try {
          const d = await api<{ course: { title: string; price_rial: number }; owned_by_viewer: boolean }>(
            `/courses/${encodeURIComponent(it.slug)}`,
          );
          return { ...it, title: d.course.title, price_rial: d.course.price_rial, owned: d.owned_by_viewer };
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) return { ...it, missing: true };
          return it; // network hiccup: keep the stored snapshot
        }
      }),
    );
    setRows(next);
    setRefreshing(false);
  }, [items]);

  React.useEffect(() => {
    if (hydrated) void refresh();
  }, [hydrated, refresh]);

  const payable = rows.filter((r) => !r.owned && !r.missing);
  const payableIds = payable.map((r) => r.course_id).join(",");
  const subtotal = payable.reduce((sum, r) => sum + r.price_rial, 0);
  // a 100% coupon (or free cart) means no gateway: claim the course for free
  const isFree = payable.length > 0 && subtotal - discount <= 0;

  // a stale preview must not survive a cart change
  React.useEffect(() => {
    setDiscount(0);
    setAppliedCode("");
  }, [payableIds]);

  // validate-only: no order is created until a pay button is pressed
  async function applyCoupon() {
    if (payable.length === 0) return;
    setError("");
    setBusy(true);
    try {
      const preview = await api<{ code: string; discount_rial: number; total_rial: number }>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ course_ids: payable.map((r) => r.course_id), code: coupon.trim() }),
      });
      setDiscount(preview.discount_rial);
      setAppliedCode(preview.code);
    } catch (err) {
      setDiscount(0);
      setAppliedCode("");
      const apiErr = err instanceof ApiError ? err : null;
      // map backend coupon codes to precise Persian hints
      const hints: Record<string, string> = {
        COUPON_NOT_ACTIVE: "این کد تخفیف غیرفعال است یا خارج از بازه معتبر است.",
        COUPON_EXPIRED: "این کد تخفیف منقضی شده است.",
        COUPON_EXHAUSTED: "سقف استفاده از این کد تخفیف تمام شده است.",
        COUPON_PER_USER_LIMIT: "شما قبلاً از این کد تخفیف استفاده کرده‌اید.",
        COUPON_MIN_AMOUNT: "مبلغ سبد خرید برای اعمال این کد تخفیف کافی نیست.",
        COUPON_SCOPE_MISMATCH: "این کد تخفیف فقط برای یک دوره خاص قابل استفاده است.",
        COUPON_FIRST_PURCHASE: "این کد تخفیف فقط برای خرید اولین دوره قابل استفاده است.",
        COUPON_ALREADY_USED: "این کد تخفیف قبلاً برای این سفارش اعمال شده است.",
        COUPON_VALUE_INVALID: "مقدار کد تخفیف نامعتبر است.",
      };
      setError(apiErr ? (hints[apiErr.code] ?? apiErr.message) : "خطا در برقراری ارتباط");
    } finally {
      setBusy(false);
    }
  }

  async function pay(gw: Gateway) {
    if (payable.length === 0) return;
    if (isFree) {
      await getFree();
      return;
    }
    setError("");
    setPaying(gw);
    try {
      // the order is created here, once, right before the gateway redirect
      const o = await api<{ id: string }>("/checkout", {
        method: "POST",
        body: JSON.stringify({
          course_ids: payable.map((r) => r.course_id),
          coupon_code: appliedCode || undefined,
        }),
      });
      clear();
      await startPayment(o.id, gw);
    } catch (err) {
      setPaying(null);
      if (err instanceof ApiError && err.code === "ALREADY_OWNED") {
        setError("یکی از دوره‌های سبد را قبلاً خریده‌اید؛ فهرست به‌روزرسانی شد.");
        void refresh();
        return;
      }
      setError(err instanceof ApiError ? err.message : "خطا در برقراری ارتباط");
    }
  }

  // claim a free order (100% coupon): backend marks it paid, no gateway
  async function getFree() {
    if (payable.length === 0) return;
    setError("");
    setBusy(true);
    try {
      const o = await api<{ id: string; status: string }>("/checkout", {
        method: "POST",
        body: JSON.stringify({
          course_ids: payable.map((r) => r.course_id),
          coupon_code: appliedCode || undefined,
        }),
      });
      clear();
      setBusy(false);
      // order is already paid server-side; go to dashboard
      void router.push("/dashboard");
    } catch (err) {
      setBusy(false);
      const apiErr = err instanceof ApiError ? err : null;
      setError(apiErr ? apiErr.message : "خطا در برقراری ارتباط");
    }
  }

  if (!hydrated || (refreshing && items.length > 0 && rows.length === 0)) {
    return (
      <div className="mx-auto max-w-2xl space-y-3" aria-label="در حال آماده‌سازی سبد">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="سبد خرید خالی است"
        body="دوره‌هایی که می‌خواهی بخری را با «افزودن به سبد» همین‌جا جمع کن و یک‌جا پرداخت کن."
        actionHref="/courses"
        actionLabel="دیدن دوره‌ها"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-semibold text-3xl">سبد خرید</h1>

      <Card className="p-0">
        <ul className="divide-y divide-border-variant">
          {rows.map((r) => (
            <li key={r.course_id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                {r.missing ? (
                  <p className="text-sm text-muted-foreground">این دوره دیگر در دسترس نیست.</p>
                ) : (
                  <ButtonLink
                    href={`/courses/${encodeURIComponent(r.slug)}`}
                    variant="link"
                    className="h-auto p-0 font-medium text-foreground"
                  >
                    {r.title}
                  </ButtonLink>
                )}
                {r.owned && (
                  <Badge tone="success" className="mt-1.5">خریده‌اید</Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!r.missing && <span className="text-sm">{formatTomanFromRial(r.price_rial)}</span>}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`حذف ${r.title} از سبد`}
                  onClick={() => remove(r.course_id)}
                >
                  <TrashIcon className="size-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">جمع دوره‌ها</span>
            <span>{formatTomanFromRial(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-success-text">
              <span>تخفیف {appliedCode && <span dir="ltr">({appliedCode})</span>}</span>
              <span>{formatTomanFromRial(Math.min(discount, subtotal))}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-semibold">قابل پرداخت</span>
            <span className="font-semibold text-xl">{isFree ? "رایگان" : formatTomanFromRial(Math.max(0, subtotal - discount))}</span>
          </div>
        </div>

        {payable.length > 0 && (
          <div className="mt-5 flex gap-2">
            <Field label="کد تخفیف" htmlFor="cart-coupon" className="flex-1">
              <Input
                id="cart-coupon"
                dir="ltr"
                placeholder="مثلاً WELCOME"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
            </Field>
            <Button variant="outline" className="mt-6" onClick={() => void applyCoupon()} loading={busy}>
              اعمال
            </Button>
          </div>
        )}

        {error && <Alert className="mt-4">{error}</Alert>}

        {payable.length === 0 ? (
          <p className="mt-5 rounded-field bg-muted px-4 py-3 text-sm leading-7 text-muted-foreground">
            همهٔ دوره‌های سبد خریده شده یا در دسترس نیستند؛ برای خرید دوره‌ای جدید سراغ «دوره‌ها» برو.
          </p>
        ) : isFree ? (
          <div className="mt-6 rounded-field bg-success-bg p-5 text-center">
            <p className="text-sm leading-7 text-success-text">
             discount ۱۰۰٪ اعمال شد؛ این دوره را به‌صورت رایگان دریافت می‌کنید.
            </p>
            <Button
              className="mt-4"
              size="lg"
              onClick={() => void getFree()}
              loading={busy}
              disabled={status !== "ready" || !session}
            >
              دریافت دوره رایگان
            </Button>
            {status !== "ready" || !session ? (
              <p className="mt-2 text-xs text-muted-foreground">
                برای دریافت ابتدا وارد حساب شوید.
              </p>
            ) : null}
          </div>
        ) : status === "ready" && !session ? (
          <div className="mt-6 rounded-field bg-muted p-5 text-center">
            <p className="text-sm leading-7 text-muted-foreground">
              برای پرداخت ابتدا وارد حسابت شو؛ سبد خریدت محفوظ می‌ماند.
            </p>
            <ButtonLink href={`/login?next=${encodeURIComponent("/cart")}`} className="mt-4" size="lg">
              ورود به حساب
            </ButtonLink>
          </div>
        ) : (
          <PayGateways onPay={(gw) => void pay(gw)} busyGateway={paying} disabled={status === "loading" || busy} />
        )}
      </Card>
    </div>
  );
}
