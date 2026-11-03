"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Field, Textarea } from "@/components/ui/input";
import { formatTomanFromRial, ApiError } from "@/lib/api";
import { adminGetOrder, adminRefundOrder, type AdminOrderDetail } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; cls: string }> = {
  awaiting_payment: { label: "در انتظار پرداخت", cls: "bg-warning-bg text-warning-text" },
  paid: { label: "پرداخت‌شده", cls: "bg-success-bg text-success-text" },
  canceled: { label: "لغوشده", cls: "bg-accent text-muted-foreground" },
  expired: { label: "منقضی", cls: "bg-accent text-muted-foreground" },
  refunded: { label: "بازگشت‌خورده", cls: "bg-destructive-bg text-destructive-text" },
};

const PAYMENT_FA: Record<string, string> = {
  pending: "در انتظار",
  verified: "تأییدشده",
  failed: "ناموفق",
  canceled: "لغوشده",
};

const EVENT_FA: Record<string, string> = {
  request_sent: "درخواست پرداخت به درگاه ارسال شد",
  request_ok: "درگاه درخواست را پذیرفت",
  redirect: "کاربر به درگاه هدایت شد",
  callback_received: "بازگشت از درگاه دریافت شد",
  verify_ok: "پرداخت تأیید شد",
  verify_failed: "تأیید پرداخت ناموفق بود",
  reconciled: "تطبیق خودکار انجام شد",
  reverse_requested: "درخواست برگشت وجه ثبت شد",
  refund_recorded: "بازگشت وجه ثبت شد",
};

/** the API names the event list `events`; payload is base64-encoded JSON.
    Older builds shipped Go-default keys, so read both shapes. */
type PaymentEventRow = {
  id?: string;
  ID?: string;
  type?: string;
  Type?: string;
  payload?: string;
  Payload?: string;
  created_at?: string;
  CreatedAt?: string;
};

/** the event payload is base64 JSON; a readable line beats raw bytes */
function payloadLine(b64?: string): string {
  if (!b64) return "";
  try {
    const json = decodeURIComponent(
      Array.from(atob(b64))
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    const obj = JSON.parse(json) as Record<string, unknown>;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(" · ");
  } catch {
    return "";
  }
}

/** admin order detail: items, every payment attempt, the event timeline and
    the refund action. Replaces the old dialog with a shareable page. */
export default function AdminOrderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [order, setOrder] = React.useState<AdminOrderDetail | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");

  const [refunding, setRefunding] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [refundBusy, setRefundBusy] = React.useState(false);

  const load = React.useCallback(() => {
    setError("");
    setLoaded(false);
    adminGetOrder(id)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiError ? err.message : "دریافت سفارش ناموفق بود."))
      .finally(() => setLoaded(true));
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function refund() {
    if (!order) return;
    setRefundBusy(true);
    setError("");
    try {
      await adminRefundOrder(order.id, reason.trim() || "بدون توضیح");
      setRefunding(false);
      setReason("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بازگشت وجه ناموفق بود.");
    } finally {
      setRefundBusy(false);
    }
  }

  const status = order ? (STATUS_FA[order.status] ?? { label: order.status, cls: "bg-accent text-muted-foreground" }) : null;
  const events = (order?.events ?? []) as PaymentEventRow[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong transition-colors hover:text-primary-hover"
        >
          <ArrowRightIcon className="size-4" aria-hidden />
          بازگشت به سفارش‌ها
        </Link>
        {order?.status === "paid" && !refunding && (
          <Button variant="destructive" size="sm" onClick={() => setRefunding(true)}>
            بازگشت وجه
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {!loaded ? (
        <div className="space-y-3" aria-label="در حال بارگذاری سفارش">
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-40 w-full animate-pulse rounded bg-muted" />
        </div>
      ) : !order ? (
        <Alert>سفارش پیدا نشد.</Alert>
      ) : (
        <div className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="hero-band flex flex-wrap items-center justify-between gap-3 px-6 py-5">
              <div>
                <h1 className="text-lg font-semibold text-foreground">سفارش</h1>
                <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                  {order.id}
                </p>
              </div>
              <div className="text-end">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status?.cls}`}>
                  {status?.label}
                </span>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {order.created_at ? formatJalali(new Date(order.created_at)) : ""}
                </p>
              </div>
            </div>

            <dl className="grid gap-x-8 gap-y-3 border-b border-line px-6 py-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">جمع دوره‌ها</dt>
                <dd className="mt-0.5">{formatTomanFromRial(order.subtotal_rial)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">تخفیف</dt>
                <dd className="mt-0.5">{formatTomanFromRial(order.discount_rial)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">قابل پرداخت</dt>
                <dd className="mt-0.5 text-base font-semibold text-foreground">
                  {formatTomanFromRial(order.total_rial)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">زمان پرداخت</dt>
                <dd className="mt-0.5">
                  {order.paid_at ? formatJalali(new Date(order.paid_at)) : "پرداخت نشده"}
                </dd>
              </div>
            </dl>

            <div className="border-b border-line px-6 py-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">اقلام سفارش</h2>
              <ul className="divide-y divide-border-variant text-sm">
                {(order.items ?? []).map((it) => (
                  <li key={it.course_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span className="font-medium text-foreground">{it.title_snapshot}</span>
                    <span className="text-muted-foreground">{formatTomanFromRial(it.unit_price_rial)}</span>
                  </li>
                ))}
                {(order.items ?? []).length === 0 && (
                  <li className="py-2 text-xs text-muted-foreground">قلمی ثبت نشده است.</li>
                )}
              </ul>
            </div>

            <div className="px-6 py-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">پرداخت‌ها</h2>
              {(order.payments ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">پرداختی ثبت نشده است.</p>
              ) : (
                <ul className="space-y-2.5">
                  {(order.payments ?? []).map((p) => (
                    <li key={p.id} className="rounded-surface border border-line p-4 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            p.status === "verified"
                              ? "bg-success-bg text-success-text"
                              : p.status === "failed"
                                ? "bg-destructive-bg text-destructive-text"
                                : "bg-warning-bg text-warning-text"
                          }`}
                        >
                          {p.status === "verified" && <CheckIcon className="size-3" aria-hidden />}
                          {PAYMENT_FA[p.status] ?? p.status}
                        </span>
                        <span className="font-medium text-foreground" dir="ltr">
                          {p.gateway}
                        </span>
                        <span className="text-muted-foreground">{formatTomanFromRial(p.amount_rial)}</span>
                        {p.card_masked && (
                          <span className="text-xs text-muted-foreground" dir="ltr">
                            {p.card_masked}
                          </span>
                        )}
                      </div>
                      {"gateway_ref" in p && (p as { gateway_ref?: string }).gateway_ref && (
                        <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                          ref: {(p as { gateway_ref?: string }).gateway_ref}
                        </p>
                      )}
                      {"failure_reason" in p && (p as { failure_reason?: string }).failure_reason && (
                        <p className="mt-1 text-xs text-destructive-text">
                          {(p as { failure_reason?: string }).failure_reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {refunding && (
            <Card className="border-destructive/40 p-5">
              <h2 className="text-sm font-semibold text-foreground">بازگشت وجه سفارش</h2>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                با ثبت بازگشت وجه، دسترسی دوره‌های این سفارش نیز لغو می‌شود.
              </p>
              <Field label="دلیل (برای مدیر بعدی)" htmlFor="refund-reason" className="mt-3">
                <Textarea
                  id="refund-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-20"
                />
              </Field>
              <div className="mt-4 flex gap-2">
                <Button variant="destructive" loading={refundBusy} disabled={reason.trim().length < 3} onClick={() => void refund()}>
                  ثبت بازگشت وجه
                </Button>
                <Button variant="outline" onClick={() => setRefunding(false)}>
                  انصراف
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-0">
            <div className="border-b border-line px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">رویدادهای پرداخت</h2>
            </div>
            {events.length === 0 ? (
              <p className="px-6 py-5 text-xs text-muted-foreground">رویدادی ثبت نشده است.</p>
            ) : (
              <ol className="px-6 py-4 text-sm">
                {events.map((ev, i) => {
                  const type = ev.type ?? ev.Type ?? "";
                  const at = ev.created_at ?? ev.CreatedAt;
                  const payload = ev.payload ?? ev.Payload;
                  return (
                    <li key={ev.id ?? ev.ID ?? i} className="relative border-s border-line pb-4 ps-5 last:pb-0">
                      <span aria-hidden className="absolute -start-1 top-1 size-2 rounded-full bg-primary" />
                      <p className="font-medium text-foreground">{EVENT_FA[type] ?? type}</p>
                      {at && <p className="mt-0.5 text-xs text-muted-foreground">{formatJalali(new Date(at))}</p>}
                      {payloadLine(payload) && (
                        <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                          {payloadLine(payload)}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <p className="text-xs text-muted-foreground">
            شناسه سفارش برای پیگیری: <span dir="ltr">{order.id}</span> · {fa((order.payments ?? []).length)} تلاش پرداخت
          </p>
        </div>
      )}
    </div>
  );
}
