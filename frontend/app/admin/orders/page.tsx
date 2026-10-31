"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { ApiError, formatTomanFromRial } from "@/lib/api";
import { adminRefundOrder } from "@/lib/admin";
import { fetchAdmin } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";

const STATUS_FA: Record<string, string> = {
  awaiting_payment: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  canceled: "لغوشده",
  expired: "منقضی",
  refunded: "بازگشت‌خورده",
};

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  total_rial: number;
  created_at: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<OrderRow[]>([]);
  const [error, setError] = React.useState("");
  const [refunding, setRefunding] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetchAdmin<{ data: OrderRow[] }>("/orders?per_page=50");
      setOrders(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت سفارش‌ها");
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function refund(id: string) {
    const reason = window.prompt("دلیل بازگشت وجه:");
    if (reason == null) return;
    setRefunding(id);
    setError("");
    try {
      await adminRefundOrder(id, reason);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بازگشت وجه ناموفق بود");
    } finally {
      setRefunding(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">سفارش‌ها</h1>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {orders.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">سفارشی ثبت نشده است.</Card>
      ) : (
        <Card className="divide-y divide-border">
          {orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <p className="font-medium" dir="ltr">
                  {o.id.slice(0, 8)}…
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatJalali(new Date(o.created_at))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span>{formatTomanFromRial(o.total_rial)}</span>
                <Badge
                  className={
                    o.status === "paid"
                      ? "border-success/40 text-success"
                      : o.status === "refunded"
                        ? "border-destructive/40 text-destructive"
                        : "border-border text-muted-foreground"
                  }
                >
                  {STATUS_FA[o.status] ?? o.status}
                </Badge>
                {o.status === "paid" && (
                  <Button size="sm" variant="secondary" disabled={refunding === o.id} onClick={() => refund(o.id)}>
                    {refunding === o.id ? "…" : "بازگشت وجه"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
