"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, api, formatTomanFromRial } from "@/lib/api";
import { fetchAdmin } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

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

const PER_PAGE = 20;

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState<CouponRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    code: "",
    type: "percent",
    value: "",
    max_uses: "",
    per_user_limit: "1",
  });

  const load = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
      if (status) params.set("status", status);
      const res = await fetchAdmin<{ data: CouponRow[]; meta: { total: number } }>(
        `/admin/coupons?${params}`,
      );
      setCoupons(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت کدهای تخفیف");
    } finally {
      setLoaded(true);
    }
  }, [page, status]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api("/admin/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code.trim(),
          type: form.type,
          value: Number(form.value || "0"),
          max_uses: form.max_uses ? Number(form.max_uses) : null,
          per_user_limit: form.per_user_limit ? Number(form.per_user_limit) : null,
        }),
      });
      setShowForm(false);
      setForm({ code: "", type: "percent", value: "", max_uses: "", per_user_limit: "1" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در ساخت کد تخفیف");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, current: string) {
    setError("");
    setBusy(id);
    try {
      await api(`/admin/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: current === "active" ? "inactive" : "active" }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="reveal text-xl leading-7 text-foreground">کدهای تخفیف</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loaded ? `${fa(total)} کد ثبت شده است.` : "در حال شمارش کدها…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <TabsList variant="line" className="h-9 gap-4 p-0">
              <TabsTrigger value="">همه</TabsTrigger>
              <TabsTrigger value="active">فعال</TabsTrigger>
              <TabsTrigger value="inactive">غیرفعال</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant={showForm ? "outline" : "default"} onClick={() => setShowForm((s) => !s)}>
            {showForm ? "بستن فرم" : "کد تازه"}
          </Button>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}

      {showForm && (
        <Card className="p-6">
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
              <Select id="c-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
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

      {!loaded ? (
        <Card className="space-y-3 p-6" aria-label="در حال بارگذاری کدهای تخفیف">
          <div className="h-5 w-1/3 animate-pulse rounded bg-accent" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-accent" />
        </Card>
      ) : coupons.length === 0 ? (
        <EmptyState title="کد تخفیفی ثبت نشده است" body="کد بساز تا در صفحهٔ پرداخت قابل استفاده باشد." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">کد</TableHead>
                  <TableHead className="text-start">مقدار</TableHead>
                  <TableHead className="text-start">سقف</TableHead>
                  <TableHead className="text-start">وضعیت</TableHead>
                  <TableHead className="text-start">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-start font-medium" dir="ltr">
                      {c.code}
                    </TableCell>
                    <TableCell className="text-start text-foreground">
                      {c.type === "percent"
                        ? `${c.value}٪`
                        : formatTomanFromRial(c.value)}
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground">
                      {c.max_uses ?? "نامحدود"}
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge tone={c.status === "active" ? "success" : "neutral"}>
                        {c.status === "active" ? "فعال" : "غیرفعال"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-start">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busy === c.id}
                        onClick={() => toggle(c.id, c.status)}
                      >
                        {c.status === "active" ? "غیرفعال کردن" : "فعال کردن"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </Card>
      )}

      {loaded && total > 0 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            صفحهٔ {fa(page)} از {fa(Math.max(1, Math.ceil(total / PER_PAGE)))}
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
              disabled={page >= Math.ceil(total / PER_PAGE)}
              onClick={() => setPage((p) => p + 1)}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
