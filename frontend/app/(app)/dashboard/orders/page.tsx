import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMe } from "@/lib/me-server";
import { formatTomanFromRial, type Order } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";

export const metadata: Metadata = { title: "سفارش‌های من", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "destructive" | "neutral" }> = {
  paid: { label: "پرداخت‌شده", tone: "success" },
  awaiting_payment: { label: "در انتظار پرداخت", tone: "warning" },
  canceled: { label: "لغوشده", tone: "neutral" },
  expired: { label: "منقضی", tone: "neutral" },
  refunded: { label: "بازگشت‌خورده", tone: "destructive" },
};

export default async function MyOrdersPage() {
  const me = await getMe();
  if (!me) {
    return (
      <EmptyState
        className="mt-10"
        title="برای دیدن سفارش‌ها ابتدا وارد شو"
        actionHref="/login"
        actionLabel="ورود به حساب"
      />
    );
  }

  const orders = await myOrders();
  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl leading-7 text-foreground">سفارش‌های من</h1>
        <EmptyState
          title="سفارشی ثبت نشده است"
          body="با اولین خرید، سفارش و رسیدش همین‌جا فهرست می‌شود."
          actionHref="/courses"
          actionLabel="دیدن دوره‌ها"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="reveal text-xl leading-7 text-foreground">سفارش‌های من</h1>
      <div className="space-y-3">
        {orders.map((o) => {
          const status = STATUS_FA[o.status] ?? { label: o.status, tone: "neutral" as const };
          return (
            <Card key={o.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground" dir="ltr">
                    {o.id.slice(0, 8)}…
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatJalali(new Date(o.created_at ?? Date.now()))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {formatTomanFromRial(o.total_rial)}
                  </span>
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {o.status === "awaiting_payment" && (
                    <span className="text-xs text-warning-text">مهلت پرداخت فعال است</span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border-variant pt-3 text-xs text-muted-foreground">
                {o.paid_at && <span>پرداخت: {formatJalali(new Date(o.paid_at))}</span>}
                {o.discount_rial > 0 && (
                  <span className="text-success-text">تخفیف: {formatTomanFromRial(o.discount_rial)}</span>
                )}
                {o.items?.map((it) => (
                  <span key={it.course_id}>{it.title_snapshot}</span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

async function myOrders(): Promise<Order[]> {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  try {
    const res = await fetch(`${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/me/orders`, {
      headers: { Cookie: `gl_at=${access}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: Order[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}
