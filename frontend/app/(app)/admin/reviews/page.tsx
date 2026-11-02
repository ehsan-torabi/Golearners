"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApiError,
  adminListReviews,
  adminModerateReview,
  type AdminReview,
} from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

const FILTERS = [
  { value: "pending", label: "در انتظار تأیید" },
  { value: "approved", label: "تأییدشده" },
  { value: "rejected", label: "ردشده" },
  { value: "", label: "همه" },
];

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "destructive" }> = {
  pending: { label: "در انتظار تأیید", tone: "warning" },
  approved: { label: "تأییدشده", tone: "success" },
  rejected: { label: "ردشده", tone: "destructive" },
};

const PER_PAGE = 20;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState<AdminReview[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("pending");
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");

  const load = React.useCallback(async () => {
    setError("");
    try {
      const res = await adminListReviews({ page, per_page: PER_PAGE, status });
      setReviews(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت نظرها");
    } finally {
      setLoaded(true);
    }
  }, [page, status]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function moderate(review: AdminReview, approve: boolean) {
    setError("");
    setBusy(review.id);
    try {
      await adminModerateReview(review.id, approve);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت نظر ناموفق بود.");
    } finally {
      setBusy("");
    }
  }

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="reveal text-xl leading-7 text-foreground">نظرهای دانشجوها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loaded
              ? `${fa(total)} نظر${status === "pending" ? " منتظر تأیید" : ""}.`
              : "در حال شمارش نظرها…"}
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
          <div className="space-y-3 p-6" aria-label="در حال بارگذاری نظرها">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            title="نظری با این فیلتر نیست"
            body="نظرها پس از ثبت توسط دانشجوهای دوره در همین صف دیده می‌شوند."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">دوره</TableHead>
                <TableHead className="text-start">نویسنده</TableHead>
                <TableHead className="text-start">امتیاز</TableHead>
                <TableHead className="text-start">متن</TableHead>
                <TableHead className="text-start">تاریخ</TableHead>
                <TableHead className="text-start">وضعیت</TableHead>
                <TableHead className="text-start">کنش‌ها</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((rv) => {
                const meta = STATUS_FA[rv.status] ?? { label: rv.status, tone: "neutral" as const };
                return (
                  <TableRow key={rv.id}>
                    <TableCell className="text-start text-sm">{rv.course_title || "—"}</TableCell>
                    <TableCell className="text-start text-sm">
                      {rv.author_name || "دانشجو"}
                    </TableCell>
                    <TableCell className="text-start">
                      <span className="text-warning" aria-label={`امتیاز ${fa(rv.rating)} از ۵`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span key={i} aria-hidden className={rv.rating >= i ? "" : "opacity-30"}>
                            ★
                          </span>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-72 text-start text-sm leading-6">
                      {rv.body ? (
                        <span className="line-clamp-3 text-muted-foreground">{rv.body}</span>
                      ) : (
                        <span className="text-muted-foreground">بدون متن</span>
                      )}
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground">
                      {formatJalali(new Date(rv.submitted_at ?? rv.approved_at ?? Date.now()))}
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-start">
                      <div className="flex flex-wrap items-center gap-1">
                        {rv.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            loading={busy === rv.id}
                            onClick={() => void moderate(rv, true)}
                          >
                            تأیید
                          </Button>
                        )}
                        {rv.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive-text"
                            loading={busy === rv.id}
                            onClick={() => void moderate(rv, false)}
                          >
                            رد
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
    </div>
  );
}
