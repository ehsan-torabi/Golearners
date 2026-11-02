import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTomanFromRial } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

export const metadata: Metadata = { title: "جزئیات سفارش", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "destructive" | "neutral" }> = {
  paid: { label: "پرداخت‌شده", tone: "success" },
  awaiting_payment: { label: "در انتظار پرداخت", tone: "warning" },
  canceled: { label: "لغوشده", tone: "neutral" },
  expired: { label: "منقضی", tone: "neutral" },
  refunded: { label: "بازگشت‌خورده", tone: "destructive" },
};

const PAYMENT_FA: Record<string, string> = {
  pending: "در انتظار",
  verified: "تأییدشده",
  failed: "ناموفق",
  canceled: "لغوشده",
};

interface DetailOrder {
  id: string;
  status: string;
  subtotal_rial: number;
  discount_rial: number;
  total_rial: number;
  expires_at: string;
  created_at?: string;
  paid_at?: string | null;
  items?: { course_id: string; title_snapshot: string; unit_price_rial: number }[];
  payments?: {
    id: string;
    gateway: string;
    status: string;
    amount_rial: number;
    card_masked: string | null;
    created_at?: string;
    verified_at?: string | null;
  }[];
}

/** the buyer's own order with its payment attempts; 404 keeps other ids out */
async function myOrder(id: string): Promise<DetailOrder | null> {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  try {
    const res = await fetch(
      `${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/me/orders/${encodeURIComponent(id)}`,
      { headers: { Cookie: `gl_at=${access}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as DetailOrder;
  } catch {
    return null;
  }
}

export default async function MyOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await myOrder(id);
  if (!order) {
    return (
      <EmptyState
        className="mt-10"
        title="سفارش پیدا نشد"
        body="این سفارش به حساب شما تعلق ندارد یا شناسه اشتباه است."
        actionHref="/dashboard/orders"
        actionLabel="سفارش‌های من"
      />
    );
  }

  const status = STATUS_FA[order.status] ?? { label: order.status, tone: "neutral" as const };
  const paid = order.status === "paid";

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong transition-colors hover:text-primary-hover"
      >
        <ArrowRightIcon className="size-4" aria-hidden />
        بازگشت به سفارش‌ها
      </Link>

      <Card className="reveal overflow-hidden p-0">
        {/* receipt header: status band with the order facts */}
        <div className="hero-band flex flex-wrap items-center justify-between gap-3 px-6 py-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">جزئیات سفارش</h1>
            <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
              {order.id}
            </p>
          </div>
          <div className="text-end">
            <Badge tone={status.tone}>{status.label}</Badge>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {order.created_at ? formatJalali(new Date(order.created_at)) : ""}
            </p>
          </div>
        </div>

        {/* items */}
        <div className="border-b border-line px-6 py-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">اقلام سفارش</h2>
          <ul className="divide-y divide-border-variant">
            {(order.items ?? []).map((it) => (
              <li key={it.course_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="font-medium text-foreground">{it.title_snapshot}</span>
                <span className="text-muted-foreground">{formatTomanFromRial(it.unit_price_rial)}</span>
              </li>
            ))}
            {(order.items ?? []).length === 0 && (
              <li className="py-2 text-xs text-muted-foreground">قلمی ثبت نشده است.</li>
            )}
          </ul>
        </div>

        {/* totals breakdown */}
        <dl className="space-y-2 border-b border-line px-6 py-5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">جمع دوره‌ها</dt>
            <dd>{formatTomanFromRial(order.subtotal_rial)}</dd>
          </div>
          {order.discount_rial > 0 && (
            <div className="flex items-center justify-between text-success-text">
              <dt>تخفیف</dt>
              <dd>{formatTomanFromRial(order.discount_rial)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-line pt-2.5 text-base font-semibold text-foreground">
            <dt>قابل پرداخت</dt>
            <dd>{formatTomanFromRial(order.total_rial)}</dd>
          </div>
        </dl>

        {/* payment attempts */}
        <div className="px-6 py-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">پرداخت‌ها</h2>
          {(order.payments ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {paid ? "پرداخت بدون رهگیری ثبت شده است." : "پرداختی برای این سفارش ثبت نشده است."}
            </p>
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
                  {p.created_at && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {formatJalali(new Date(p.created_at))}
                      {p.verified_at && ` · تأیید: ${formatJalali(new Date(p.verified_at))}`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {order.status === "awaiting_payment" && (
            <p className="mt-3 rounded-field bg-warning-bg px-3 py-2 text-xs leading-6 text-warning-text">
              مهلت پرداخت این سفارش تا {fa(Math.max(0, Math.round((new Date(order.expires_at).getTime() - Date.now()) / 60000)))} دقیقه دیگر باز است؛
              پس از انقضا سفارش به‌صورت خودکار بسته می‌شود.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
