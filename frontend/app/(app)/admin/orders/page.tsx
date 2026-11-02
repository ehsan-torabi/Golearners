"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Textarea } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, formatTomanFromRial } from "@/lib/api";
import { adminRefundOrder, fetchAdmin } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "destructive" | "neutral" }> = {
  awaiting_payment: { label: "در انتظار پرداخت", tone: "warning" },
  paid: { label: "پرداخت‌شده", tone: "success" },
  canceled: { label: "لغوشده", tone: "neutral" },
  expired: { label: "منقضی", tone: "neutral" },
  refunded: { label: "بازگشت‌خورده", tone: "destructive" },
};

const FILTERS = [
  { value: "", label: "همه" },
  { value: "awaiting_payment", label: "در انتظار" },
  { value: "paid", label: "پرداخت‌شده" },
  { value: "refunded", label: "بازگشت‌خورده" },
  { value: "expired", label: "منقضی" },
];

const PER_PAGE = 20;

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  subtotal_rial: number;
  discount_rial: number;
  total_rial: number;
  paid_at: string | null;
  created_at: string;
}

interface OrderDetail {
  id: string;
  status: string;
  subtotal_rial: number;
  discount_rial: number;
  total_rial: number;
  created_at: string;
  items?: { title_snapshot: string; unit_price_rial: number }[];
  payments?: {
    id: string;
    gateway: string;
    status: string;
    amount_rial: number;
    card_masked: string | null;
    failure_reason: string | null;
    created_at: string;
  }[];
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
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [target, setTarget] = React.useState<OrderRow | null>(null);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
      if (status) params.set("status", status);
      const res = await fetchAdmin<{ data: OrderRow[]; meta: { total: number } }>(
        `/admin/orders?${params}`,
      );
      setOrders(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت سفارش‌ها");
    } finally {
      setLoaded(true);
    }
  }, [page, status]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="reveal text-xl leading-7 text-foreground">سفارش‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loaded ? `${fa(total)} سفارش ثبت شده است.` : "در حال شمارش سفارش‌ها…"}
          </p>
        </div>
        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <TabsList variant="line" className="h-9 gap-4 p-0">
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        {!loaded ? (
          <div className="space-y-3 p-6" aria-label="در حال بارگذاری سفارش‌ها">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState title="سفارشی با این فیلترها نیست" body="فیلتر وضعیت را تغییر دهید." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">سفارش</TableHead>
                <TableHead className="text-start">مبلغ</TableHead>
                <TableHead className="text-start">تاریخ</TableHead>
                <TableHead className="text-start">وضعیت</TableHead>
                <TableHead className="text-start">کنش‌ها</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const meta = STATUS_FA[o.status] ?? { label: o.status, tone: "neutral" as const };
                return (
                  <TableRow key={o.id}>
                    <TableCell className="text-start" dir="ltr">
                      {o.id.slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-start">{formatTomanFromRial(o.total_rial)}</TableCell>
                    <TableCell className="text-start text-muted-foreground">
                      {formatJalali(new Date(o.created_at))}
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-start">
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/admin/orders/${o.id}`} />}
                          nativeButton={false}
                        >
                          جزئیات
                        </Button>
                        {o.status === "paid" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive-text"
                            onClick={() => setTarget(o)}
                          >
                            بازگشت وجه
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {loaded && total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border-variant px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              صفحهٔ {fa(page)} از {fa(pages)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                قبلی
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                بعدی
              </Button>
            </div>
          </div>
        )}
      </Card>

      <RefundDialog order={target} onClose={() => setTarget(null)} onDone={() => void load()} />
    </div>
  );
}
