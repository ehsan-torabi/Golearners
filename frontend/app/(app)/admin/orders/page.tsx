"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Textarea } from "@/components/ui/input";
import { ApiError, formatTomanFromRial } from "@/lib/api";
import { adminRefundOrder, fetchAdmin } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "destructive" | "neutral" }> = {
  awaiting_payment: { label: "در انتظار پرداخت", tone: "warning" },
  paid: { label: "پرداخت‌شده", tone: "success" },
  canceled: { label: "لغوشده", tone: "neutral" },
  expired: { label: "منقضی", tone: "neutral" },
  refunded: { label: "بازگشت‌خورده", tone: "destructive" },
};

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  total_rial: number;
  created_at: string;
}

/* native <dialog>: Escape closes it, focus is trapped, no library needed */
function RefundDialog({
  order,
  onClose,
  onDone,
}: {
  order: OrderRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (order && !dlg.open) dlg.showModal();
    if (!order && dlg.open) dlg.close();
  }, [order]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setBusy(true);
    setError("");
    try {
      await adminRefundOrder(order.id, reason.trim() || "بدون توضیح");
      ref.current?.close();
      setReason("");
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بازگشت وجه ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="m-auto rounded-lg border border-border bg-card p-0 text-foreground backdrop:bg-black/45"
    >
      {order && (
        <form onSubmit={submit} className="w-[min(90vw,26rem)] p-6">
          <h2 className="text-base font-medium">بازگشت وجه سفارش</h2>
          <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
            {order.id.slice(0, 8)}… · {formatTomanFromRial(order.total_rial)}
          </p>
          <Field label="دلیل (برای مدیر بعدی)" htmlFor="refund-reason" className="mt-4">
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-20"
            />
          </Field>
          {error && <Alert className="mt-3">{error}</Alert>}
          <div className="mt-5 flex justify-start gap-2">
            <Button type="submit" variant="destructive" loading={busy} disabled={reason.trim().length < 3}>
              ثبت بازگشت وجه
            </Button>
            <Button type="button" variant="outline" onClick={() => ref.current?.close()}>
              انصراف
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [target, setTarget] = React.useState<OrderRow | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetchAdmin<{ data: OrderRow[] }>("/admin/orders?per_page=50");
      setOrders(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت سفارش‌ها");
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <h1 className="reveal text-xl leading-7 text-foreground">سفارش‌ها</h1>
      {error && <Alert>{error}</Alert>}
      {!loaded ? (
        <Card className="space-y-3 p-6" aria-label="در حال بارگذاری سفارش‌ها">
          <div className="h-5 w-1/3 animate-pulse rounded bg-accent" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-accent" />
        </Card>
      ) : orders.length === 0 ? (
        <EmptyState title="سفارشی ثبت نشده است" body="با اولین خرید، سفارش‌ها همین‌جا فهرست می‌شوند." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 text-start font-medium">شناسه</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">تاریخ</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">مبلغ</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">وضعیت</th>
                <th scope="col" className="px-5 py-3 text-start font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-variant">
              {orders.map((o) => {
                const status = STATUS_FA[o.status] ?? { label: o.status, tone: "neutral" as const };
                return (
                  <tr key={o.id} className="transition-colors hover:bg-muted">
                    <td className="px-5 py-3 text-foreground" dir="ltr">
                      {o.id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatJalali(new Date(o.created_at))}
                    </td>
                    <td className="px-5 py-3 text-foreground">{formatTomanFromRial(o.total_rial)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {o.status === "paid" ? (
                        <Button size="sm" variant="outline" onClick={() => setTarget(o)}>
                          بازگشت وجه
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <RefundDialog order={target} onClose={() => setTarget(null)} onDone={() => void load()} />
    </div>
  );
}
