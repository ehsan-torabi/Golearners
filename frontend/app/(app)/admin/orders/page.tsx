"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ExternalLink, RotateCcw } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, Select, Textarea } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DetailCard,
  DetailGrid,
  DetailItem,
  DetailSection,
  ListDetailRow,
  ListHeader,
  ListLoading,
  ListPagination,
  ListToolbar,
  RowMenu,
  useAdminList,
  useFacetCounts,
  type ListChip,
} from "@/components/admin/list-view";
import { ApiError, formatTomanFromRial } from "@/lib/api";
import { adminGetOrder, adminRefundOrder, type AdminOrderDetail } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa, formatIranMobile } from "@/lib/persian";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" | "destructive" }> = {
  awaiting_payment: { label: "در انتظار پرداخت", tone: "warning" },
  paid: { label: "پرداخت‌شده", tone: "success" },
  canceled: { label: "لغوشده", tone: "neutral" },
  expired: { label: "منقضی", tone: "neutral" },
  refunded: { label: "بازگشت‌خورده", tone: "destructive" },
};

const STATUS_VALUES = ["awaiting_payment", "paid", "canceled", "expired", "refunded"];

const SORT_OPTIONS = [
  { value: "newest", label: "تازه‌ترین" },
  { value: "oldest", label: "قدیمی‌ترین" },
  { value: "amount_desc", label: "بیشترین مبلغ" },
  { value: "amount_asc", label: "کمترین مبلغ" },
];

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  subtotal_rial: number;
  discount_rial: number;
  total_rial: number;
  paid_at: string | null;
  created_at: string;
  user_name: string;
  user_mobile: string;
}

export default function AdminOrdersPage() {
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<AdminOrderDetail | null>(null);
  const [refunding, setRefunding] = React.useState<OrderRow | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");

  const filters = React.useMemo(() => ({ q: search, status, sort }), [search, status, sort]);

  const list = useAdminList<OrderRow>({ path: "/admin/orders", filters });
  const statusCounts = useFacetCounts({
    path: "/admin/orders",
    param: "status",
    filters: { q: search },
    values: STATUS_VALUES,
  });

  // the expanded row pulls the full order: line items, payments, events
  React.useEffect(() => {
    if (!expanded) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    adminGetOrder(expanded)
      .then((res) => {
        if (!cancelled) setDetail(res ?? null);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [expanded]);

  async function refund() {
    if (!refunding) return;
    setError("");
    setBusy(refunding.id);
    try {
      await adminRefundOrder(refunding.id, reason.trim() || "بازگشت وجه توسط مدیر");
      setRefunding(null);
      setReason("");
      setExpanded(null);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "بازگشت وجه ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  const chips: ListChip[] = [];
  if (status) {
    chips.push({
      key: "status",
      label: `وضعیت: ${STATUS_FA[status]?.label ?? status}`,
      count: statusCounts[status] ?? null,
      onRemove: () => setStatus(""),
    });
  }

  return (
    <div className="space-y-4">
      <ListHeader title="سفارش‌ها" count={list.loading ? null : list.total} unit="سفارش" />

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        <ListToolbar
          search={{
            value: query,
            onChange: setQuery,
            onSubmit: () => setSearch(query.trim()),
            placeholder: "شناسهٔ سفارش",
          }}
          chips={chips}
          sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
          filters={
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">وضعیت</p>
                <Select aria-label="فیلتر وضعیت" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
                  <option value="">همهٔ وضعیت‌ها</option>
                  {STATUS_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_FA[value].label}
                    </option>
                  ))}
                </Select>
              </div>
              <Button size="sm" variant="ghost" className="w-full" onClick={() => setStatus("")}>
                پاک کردن فیلترها
              </Button>
            </div>
          }
        />

        {list.loading ? (
          <ListLoading label="در حال بارگذاری سفارش‌ها" />
        ) : list.items.length === 0 ? (
          <EmptyState title="سفارشی با این فیلترها نیست" body="شناسهٔ سفارش یا فیلتر وضعیت را تغییر دهید." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">سفارش</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">خریدار</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">مبلغ</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">تخفیف</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">تاریخ</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">وضعیت</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((o) => {
                const meta = STATUS_FA[o.status] ?? { label: o.status, tone: "neutral" as const };
                const open = expanded === o.id;
                return (
                  <React.Fragment key={o.id}>
                    <TableRow>
                      <TableCell className="text-start">
                        <span className="font-medium text-foreground" dir="ltr">
                          #{o.id.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell className="text-start whitespace-normal">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {o.user_name || "کاربر"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground" dir="ltr">
                            {o.user_mobile ? formatIranMobile(o.user_mobile) : "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-start">{formatTomanFromRial(o.total_rial)}</TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {o.discount_rial > 0 ? formatTomanFromRial(o.discount_rial) : "—"}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {formatJalali(new Date(o.created_at))}
                      </TableCell>
                      <TableCell className="text-start">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-start">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={open ? "بستن جزئیات" : "نمایش جزئیات"}
                            aria-expanded={open}
                            onClick={() => setExpanded(open ? null : o.id)}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          <RowMenu
                            label={`کنش‌های سفارش ${o.id.slice(0, 8)}`}
                            items={[
                              {
                                label: "مشاهدهٔ سفارش",
                                icon: <ExternalLink />,
                                onSelect: () => setExpanded(o.id),
                              },
                              {
                                label: "بازگشت وجه",
                                icon: <RotateCcw />,
                                variant: "destructive",
                                disabled: o.status !== "paid",
                                onSelect: () => setRefunding(o),
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <ListDetailRow colSpan={7}>
                        <DetailGrid>
                          <DetailItem label="خریدار">{o.user_name || "کاربر"}</DetailItem>
                          <DetailItem label="جمع کل">{formatTomanFromRial(o.total_rial)}</DetailItem>
                          <DetailItem label="تخفیف">
                            {o.discount_rial > 0 ? formatTomanFromRial(o.discount_rial) : "—"}
                          </DetailItem>
                          <DetailItem label="پرداخت">
                            {o.paid_at ? formatJalali(new Date(o.paid_at)) : "پرداخت نشده"}
                          </DetailItem>
                          <DetailItem label="مهلت پرداخت">
                            {detail?.expires_at ? formatJalali(new Date(detail.expires_at)) : "—"}
                          </DetailItem>
                          <DetailItem label="شناسه">
                            <span dir="ltr" className="text-xs">
                              {o.id}
                            </span>
                          </DetailItem>
                        </DetailGrid>
                        <div className="space-y-4">
                          <DetailSection title="اقلام سفارش" count={detail?.items?.length}>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {(detail?.items ?? []).map((item) => (
                                <DetailCard
                                  key={item.course_id}
                                  title={item.title_snapshot}
                                  subtitle={formatTomanFromRial(item.unit_price_rial)}
                                />
                              ))}
                              {(detail?.items ?? []).length === 0 && (
                                <p className="text-sm text-muted-foreground">قلمی ثبت نشده است.</p>
                              )}
                            </div>
                          </DetailSection>
                          <DetailSection title="پرداخت‌ها" count={detail?.payments?.length}>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {(detail?.payments ?? []).map((payment) => (
                                <DetailCard
                                  key={payment.id}
                                  title={payment.gateway}
                                  subtitle={`${payment.status} · ${formatTomanFromRial(payment.amount_rial)}`}
                                />
                              ))}
                              {(detail?.payments ?? []).length === 0 && (
                                <p className="text-sm text-muted-foreground">پرداختی ثبت نشده است.</p>
                              )}
                            </div>
                          </DetailSection>
                        </div>
                      </ListDetailRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}

        <ListPagination page={list.page} pages={list.pages} total={list.total} onPage={list.setPage} />
      </Card>

      <RefundDialog
        order={refunding}
        reason={reason}
        busy={busy === refunding?.id}
        onReason={setReason}
        onClose={() => setRefunding(null)}
        onConfirm={() => void refund()}
      />
    </div>
  );
}

/** Refund confirmation with a reason the customer can be told about. */
function RefundDialog({
  order,
  reason,
  busy,
  onReason,
  onClose,
  onConfirm,
}: {
  order: OrderRow | null;
  reason: string;
  busy: boolean;
  onReason: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={order !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>بازگشت وجه سفارش</AlertDialogTitle>
          <AlertDialogDescription>
            مبلغ {order ? formatTomanFromRial(order.total_rial) : ""} به خریدار بازگردانده می‌شود و دسترسی او به
            دوره‌ها لغو می‌گردد.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field label="دلیل بازگشت وجه" hint="این متن در گزارش رویدادها ثبت می‌شود.">
          <Textarea
            value={reason}
            onChange={(e) => onReason(e.target.value)}
            placeholder="مثلاً: خریدار درخواست لغو سفارش داد."
            rows={3}
          />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>انصراف</AlertDialogCancel>
          <AlertDialogAction variant="destructive" loading={busy} onClick={onConfirm}>
            بازگشت وجه
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
