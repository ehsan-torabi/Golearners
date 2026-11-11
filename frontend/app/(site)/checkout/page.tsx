"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/section-head";
import { api, ApiError, couponErrorHint, formatTomanFromRial, type Order } from "@/lib/api";
import { fa } from "@/lib/utils";
import { useSession } from "@/components/use-session";
import { PayGateways, startPayment, type Gateway } from "@/components/site/pay-gateways";

/* Two entry modes, one pay surface:
   ?order=id  resume a still-awaiting order (dashboard links land here)
   ?course=x  single-course fast path; the order is created on the pay
              click only, never as a page-load side effect. */
function CheckoutInner() {
  const params = useSearchParams();
  const { status: sessionStatus, session } = useSession();
  const orderParam = params.get("order") ?? "";
  const slug = params.get("course") ?? "";
  const mode = orderParam ? "order" : slug ? "course" : "none";

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [paying, setPaying] = React.useState<Gateway | null>(null);
  const [coupon, setCoupon] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  const [owned, setOwned] = React.useState(false);
  const [guest, setGuest] = React.useState(false);
  const [courseTitle, setCourseTitle] = React.useState("");
  const [coursePrice, setCoursePrice] = React.useState(0);
  const [courseId, setCourseId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  // a /checkout that succeeded but a gateway that didn't: retry reuses this
  // awaiting order instead of creating a second one
  const [createdOrderId, setCreatedOrderId] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    setLoading(true);
    setError("");
    if (mode === "order") {
      loadOrder(orderParam);
    } else if (mode === "course") {
      loadCourse(slug);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderParam, slug]);

  async function loadOrder(id: string) {
    try {
      const o = await api<Order>(`/me/orders/${encodeURIComponent(id)}`);
      setOrder(o);
      if (o.status !== "awaiting_payment") setNotice(statusNotice(o.status));
    } catch (err) {
      setOrder(null);
      if (err instanceof ApiError && err.status === 404) setNotice("missing");
      else setError("خطا در برقراری ارتباط");
    } finally {
      setLoading(false);
    }
  }

  function statusNotice(status: string): string {
    if (status === "paid") return "paid";
    if (status === "expired") return "expired";
    return "closed";
  }

  async function loadCourse(courseSlug: string) {
    try {
      const detail = await api<{ course: { id: string; title: string; price_rial: number }; owned_by_viewer: boolean }>(
        `/courses/${encodeURIComponent(courseSlug)}`,
      );
      setCourseTitle(detail.course.title);
      setCoursePrice(detail.course.price_rial);
      setCourseId(detail.course.id);
      if (detail.owned_by_viewer) {
        setOwned(true); // already bought: never create a second order
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setGuest(true);
      else if (err instanceof ApiError && err.status === 404) setNotice("missing");
      else setError("خطا در برقراری ارتباط");
    } finally {
      setLoading(false);
    }
  }

  // validate-only: applying a coupon must not create another order
  async function applyCoupon() {
    if (mode !== "course") return;
    setError("");
    setBusy(true);
    try {
      const preview = await api<{ code: string; discount_rial: number }>("/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ course_ids: [courseId], code: coupon.trim() }),
      });
      setDiscount(preview.discount_rial);
    } catch (err) {
      setDiscount(0);
      setError(couponErrorHint(err));
    } finally {
      setBusy(false);
    }
  }

  async function pay(gw: Gateway) {
    setError("");
    setPaying(gw);
    try {
      let orderId = order?.id ?? "";
      if (mode === "course") {
        const isFree = coursePrice - discount <= 0;
        if (isFree) {
          // 100% coupon: backend marks the order paid, no gateway redirect
          const o = await api<{ id: string; status: string }>("/checkout", {
            method: "POST",
            body: JSON.stringify({ course_id: courseId, coupon_code: coupon.trim() || undefined }),
          });
          setPaying(null);
          await router.push("/dashboard");
          return;
        }
        if (createdOrderId) {
          orderId = createdOrderId; // failed redirect: resume, not re-create
        } else {
          const o = await api<{ id: string }>("/checkout", {
            method: "POST",
            body: JSON.stringify({ course_id: courseId, coupon_code: coupon.trim() || undefined }),
          });
          orderId = o.id;
          setCreatedOrderId(o.id);
        }
      }
      await startPayment(orderId, gw);
    } catch (err) {
      setPaying(null);
      if (err instanceof ApiError && err.code === "ALREADY_OWNED") {
        setOwned(true);
        return;
      }
      setError(couponErrorHint(err));
    }
  }

  if (mode === "none") {
    return (
      <Card className="mx-auto max-w-md p-8 text-center text-muted-foreground">
        دوره‌ای انتخاب نشده است؛ از سبد خرید یا صفحهٔ دوره شروع کن.
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md space-y-3" aria-label="در حال آماده‌سازی سفارش">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notice) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <h1 className="font-semibold text-2xl text-foreground">
          {notice === "paid" && "این سفارش پرداخت شده است"}
          {notice === "expired" && "مهلت پرداخت این سفارش گذشته است"}
          {notice === "closed" && "این سفارش دیگر قابل پرداخت نیست"}
          {notice === "missing" && "سفارش پیدا نشد"}
        </h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {notice === "paid"
            ? "دسترسی شما به دوره‌هایش فعال است؛ از داشبورد ادامه بده."
            : "می‌توانی از سبد خرید یک سفارش تازه بسازی یا از صفحهٔ دوره خرید را شروع کنی."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink href="/cart" size="lg">سبد خرید</ButtonLink>
          <ButtonLink href="/dashboard/orders" size="lg" variant="outline">سفارش‌های من</ButtonLink>
        </div>
      </Card>
    );
  }

  if (sessionStatus === "ready" && !session) {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-semibold text-2xl text-foreground">برای خرید ابتدا وارد شو</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          پرداخت و دسترسی به درس‌ها به حساب کاربری شما گره خورده است.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink href={`/login?next=${encodeURIComponent(mode === "order" ? `/checkout?order=${orderParam}` : `/checkout?course=${slug}`)}`} size="lg">
            ورود به حساب
          </ButtonLink>
          <ButtonLink href="/courses" size="lg" variant="outline">
            بازگشت به دوره‌ها
          </ButtonLink>
        </div>
      </Card>
    );
  }

  // the order failed to load (401 raced the session probe, network hiccup):
  // never render a pay surface with empty items and a zero total
  if (mode === "order" && !order) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <h1 className="font-semibold text-2xl text-foreground">سفارش را نتوانستیم بارگذاری کنیم</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{error || "یک خطای پیش‌بینی‌نشده رخ داد."}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink href="/dashboard/orders" size="lg">سفارش‌های من</ButtonLink>
          <ButtonLink href="/cart" size="lg" variant="outline">سبد خرید</ButtonLink>
        </div>
      </Card>
    );
  }

  if (guest) {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-semibold text-2xl text-foreground">برای خرید ابتدا وارد شو</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          پرداخت و دسترسی به درس‌ها به حساب کاربری شما گره خورده است.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink href={`/login?next=${encodeURIComponent(`/checkout?course=${slug}`)}`} size="lg">
            ورود به حساب
          </ButtonLink>
          <ButtonLink href="/courses" size="lg" variant="outline">
            بازگشت به دوره‌ها
          </ButtonLink>
        </div>
      </Card>
    );
  }

  if (owned) {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-semibold text-2xl text-foreground">این دوره را خریده‌اید</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {courseTitle
            ? `«${courseTitle}» در دوره‌های شماست و دسترسی‌تان به همه درس‌ها باز است.`
            : "این دوره در دوره‌های شماست و دسترسی‌تان به همه درس‌ها باز است."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink href={`/dashboard/courses/${encodeURIComponent(slug)}`} size="lg">
            ادامه یادگیری
          </ButtonLink>
          <ButtonLink href="/courses" size="lg" variant="outline">
            بازگشت به دوره‌ها
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const items =
    mode === "order"
      ? (order?.items ?? []).map((it) => ({ key: it.course_id, title: it.title_snapshot, price: it.unit_price_rial }))
      : [{ key: courseId, title: courseTitle, price: coursePrice }];
  const shownDiscount = mode === "order" ? (order?.discount_rial ?? 0) : discount;
  const total = mode === "order" ? (order?.total_rial ?? 0) : Math.max(0, coursePrice - discount);
  const minutesLeft = order
    ? Math.max(0, Math.round((new Date(order.expires_at).getTime() - Date.now()) / 60000))
    : null;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="font-semibold text-3xl">تسویه حساب</h1>

      <Card className="p-8">
        <div className="space-y-3 text-sm">
          {items.map((it) => (
            <div key={it.key} className="flex items-center justify-between gap-4">
              <span className="text-foreground">{it.title}</span>
              <span className="shrink-0">{formatTomanFromRial(it.price)}</span>
            </div>
          ))}
          {shownDiscount > 0 && (
            <div className="flex items-center justify-between text-success-text">
              <span>تخفیف</span>
              <span>{formatTomanFromRial(shownDiscount)}</span>
            </div>
          )}
          <div className="border-t border-line pt-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">قابل پرداخت</span>
              <span className="font-semibold text-xl">{formatTomanFromRial(total)}</span>
            </div>
            {minutesLeft !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                مهلت پرداخت: {fa(minutesLeft)} دقیقه
              </p>
            )}
          </div>
        </div>

        {mode === "course" && (
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
            <Button variant="outline" className="mt-6" onClick={() => void applyCoupon()} loading={busy}>
              اعمال
            </Button>
          </div>
        )}

        {error && <Alert className="mt-4">{error}</Alert>}

        <PayGateways onPay={(gw) => void pay(gw)} busyGateway={paying} disabled={busy} />
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
