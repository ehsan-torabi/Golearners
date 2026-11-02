"use client";

import * as React from "react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTomanFromRial } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "destructive" | "neutral" }> = {
  awaiting_payment: { label: "در انتظار پرداخت", tone: "warning" },
  paid: { label: "پرداخت‌شده", tone: "success" },
  canceled: { label: "لغوشده", tone: "neutral" },
  expired: { label: "منقضی", tone: "neutral" },
  refunded: { label: "بازگشت‌خورده", tone: "destructive" },
};

export interface OrderRow {
  id: string;
  status: string;
  total_rial: number;
  created_at: string;
  paid_at: string | null;
}

/** The learner's recent orders with a link to the full history. */
export function MyOrdersPanel({ orders, total }: { orders: OrderRow[]; total: number }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="سفارشی ثبت نشده است"
        body="هر خریدی که انجام بدهی با وضعیت پرداخت همین‌جا فهرست می‌شود."
        actionHref="/courses"
        actionLabel="دیدن دوره‌ها"
      />
    );
  }

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between gap-3 border-b border-border-variant px-4 py-3">
        <p className="text-sm text-muted-foreground">{fa(total)} سفارش ثبت شده است.</p>
        <ButtonLink href="/dashboard/orders" variant="outline" size="sm">
          همهٔ سفارش‌ها
        </ButtonLink>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">سفارش</TableHead>
            <TableHead className="text-start">مبلغ</TableHead>
            <TableHead className="text-start">تاریخ</TableHead>
            <TableHead className="text-start">وضعیت</TableHead>
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
                <TableCell className="text-start">
                  {formatTomanFromRial(o.total_rial)}
                </TableCell>
                <TableCell className="text-start text-muted-foreground">
                  {formatJalali(new Date(o.created_at))}
                </TableCell>
                <TableCell className="text-start">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
