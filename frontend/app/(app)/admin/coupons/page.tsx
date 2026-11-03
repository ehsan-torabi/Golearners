"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/input";
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
import { ApiError } from "@/lib/api";
import { api, formatTomanFromRial } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "neutral" }> = {
  active: { label: "فعال", tone: "success" },
  inactive: { label: "غیرفعال", tone: "neutral" },
};

const STATUS_VALUES = ["active", "inactive"];

interface CouponRow {
  id: string;
  code: string;
  type: string;
  value: number;
  max_uses: number | null;
  per_user_limit: number | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [status, setStatus] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<CouponRow | null>(null);
  const [copied, setCopied] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({
    code: "",
    type: "percent",
    value: "",
    max_uses: "",
    per_user_limit: "1",
  });

  const list = useAdminList<CouponRow>({
    path: "/admin/coupons",
    filters: { status },
  });
  const statusCounts = useFacetCounts({
    path: "/admin/coupons",
    param: "status",
    values: STATUS_VALUES,
  });

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api("/admin/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: Number(form.value),
          max_uses: form.max_uses ? Number(form.max_uses) : null,
          per_user_limit: form.per_user_limit ? Number(form.per_user_limit) : null,
          status: "active",
        }),
      });
      setForm({ code: "", type: "percent", value: "", max_uses: "", per_user_limit: "1" });
      setShowForm(false);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ساخت کد تخفیف ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(coupon: CouponRow) {
    setError("");
    setBusy(coupon.id);
    try {
      await api(`/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          max_uses: coupon.max_uses,
          per_user_limit: coupon.per_user_limit,
          status: coupon.status === "active" ? "inactive" : "active",
        }),
      });
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت کد ناموفق بود");
    } finally {
      setBusy("");
    }
  }

  async function removeOne() {
    if (!removing) return;
    setError("");
    setBusy(removing.id);
    try {
      await api(`/admin/coupons/${removing.id}`, { method: "DELETE" });
      setRemoving(null);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف کد تخفیف");
    } finally {
      setBusy("");
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("کپی کد ممکن نشد.");
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
      <ListHeader
        title="کدهای تخفیف"
        count={list.loading ? null : list.total}
        unit="کد"
        action={
          <Button variant={showForm ? "outline" : "default"} onClick={() => setShowForm((s) => !s)}>
            {showForm ? "بستن فرم" : "کد تازه"}
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {showForm && (
        <Card className="p-5">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="کد" htmlFor="c-code" required>
              <Input
                id="c-code"
                dir="ltr"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
            </Field>
            <Field label="نوع" htmlFor="c-type">
              <Select
                id="c-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="percent">درصدی</option>
                <option value="amount">مبلغ ثابت</option>
              </Select>
            </Field>
            <Field label="مقدار" htmlFor="c-value" required hint="برای درصد، عدد ۱۰ یعنی ۱۰٪.">
              <Input
                id="c-value"
                dir="ltr"
                inputMode="numeric"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
              />
            </Field>
            <Field label="سقف استفاده کل" htmlFor="c-max">
              <Input
                id="c-max"
                dir="ltr"
                inputMode="numeric"
                placeholder="نامحدود"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>
                ساخت کد تخفیف
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0">
        <ListToolbar
          chips={chips}
          filters={
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">وضعیت</p>
                <Select
                  aria-label="فیلتر وضعیت"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full"
                >
                  <option value="">همهٔ کدها</option>
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
          <ListLoading label="در حال بارگذاری کدهای تخفیف" />
        ) : list.items.length === 0 ? (
          <EmptyState title="کد تخفیفی ثبت نشده است" body="کد بساز تا در صفحهٔ پرداخت قابل استفاده باشد." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">کد</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">مقدار</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">سقف استفاده</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">بازه</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">وضعیت</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((c) => {
                const meta = STATUS_FA[c.status] ?? { label: c.status, tone: "neutral" as const };
                const open = expanded === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <TableRow>
                      <TableCell className="text-start">
                        <button
                          type="button"
                          onClick={() => void copyCode(c.code)}
                          className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-accent-strong"
                          dir="ltr"
                        >
                          {c.code}
                          {copied === c.code ? (
                            <Check className="size-3.5 text-success" />
                          ) : (
                            <Copy className="size-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-start">
                        {c.type === "percent" ? `${fa(c.value)}٪` : formatTomanFromRial(c.value)}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {c.max_uses ?? "نامحدود"}
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {c.ends_at ? formatJalali(new Date(c.ends_at)) : "بدون انقضا"}
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
                            onClick={() => setExpanded(open ? null : c.id)}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          <RowMenu
                            label={`کنش‌های کد ${c.code}`}
                            items={[
                              {
                                label: c.status === "active" ? "غیرفعال کردن" : "فعال کردن",
                                icon: <Check />,
                                disabled: busy === c.id,
                                onSelect: () => void toggle(c),
                              },
                              {
                                label: "حذف کد",
                                icon: <Trash2 />,
                                variant: "destructive",
                                onSelect: () => setRemoving(c),
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <ListDetailRow colSpan={6}>
                        <DetailGrid>
                          <DetailItem label="نوع">
                            {c.type === "percent" ? "درصدی" : "مبلغ ثابت"}
                          </DetailItem>
                          <DetailItem label="مقدار">
                            {c.type === "percent" ? `${fa(c.value)}٪` : formatTomanFromRial(c.value)}
                          </DetailItem>
                          <DetailItem label="سقف کل">{c.max_uses ?? "نامحدود"}</DetailItem>
                          <DetailItem label="سقف هر کاربر">{c.per_user_limit ?? "نامحدود"}</DetailItem>
                          <DetailItem label="شروع">
                            {c.starts_at ? formatJalali(new Date(c.starts_at)) : "—"}
                          </DetailItem>
                          <DetailItem label="پایان">
                            {c.ends_at ? formatJalali(new Date(c.ends_at)) : "—"}
                          </DetailItem>
                        </DetailGrid>
                        <DetailSection title="کد تخفیف">
                          <DetailCard title={c.code} subtitle="برای کپی روی کد کلیک کنید">
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3"
                              onClick={() => void copyCode(c.code)}
                            >
                              <Copy />
                              کپی کد
                            </Button>
                          </DetailCard>
                        </DetailSection>
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

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کد تخفیف</AlertDialogTitle>
            <AlertDialogDescription>
              کد {removing?.code} حذف می‌شود و دیگر در پرداخت قابل استفاده نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === removing?.id}
              onClick={() => void removeOne()}
            >
              حذف کد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
