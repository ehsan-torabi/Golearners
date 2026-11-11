"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
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
  ListError,
} from "@/components/admin/list-view";
import { ApiError, adminModerateReview, type AdminReview } from "@/lib/admin";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "destructive" }> = {
  pending: { label: "در انتظار تأیید", tone: "warning" },
  approved: { label: "تأییدشده", tone: "success" },
  rejected: { label: "ردشده", tone: "destructive" },
};

const STATUS_VALUES = ["pending", "approved", "rejected"];

export default function AdminReviewsPage() {
  const [status, setStatus] = React.useState("pending");
  const [allStatuses, setAllStatuses] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState("");
  const [error, setError] = React.useState("");

  const filters = React.useMemo(() => ({ status: allStatuses ? "" : status }), [allStatuses, status]);

  const list = useAdminList<AdminReview>({ path: "/admin/reviews", filters });
  const statusCounts = useFacetCounts({
    path: "/admin/reviews",
    param: "status",
    values: STATUS_VALUES,
  });

  async function moderate(review: AdminReview, approve: boolean) {
    setError("");
    setBusy(review.id);
    try {
      await adminModerateReview(review.id, approve);
      await list.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر وضعیت نظر ناموفق بود.");
    } finally {
      setBusy("");
    }
  }

  const chips: ListChip[] = [];
  if (!allStatuses) {
    chips.push({
      key: "status",
      label: `وضعیت: ${STATUS_FA[status]?.label ?? status}`,
      count: statusCounts[status] ?? null,
      onRemove: () => setStatus(""),
    });
  }

  return (
    <div className="space-y-4">
      <ListHeader title="نظرهای دانشجوها" count={list.loading ? null : list.total} unit="نظر" />

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        <ListToolbar
          chips={chips}
          toggle={{
            checked: allStatuses,
            onChange: setAllStatuses,
            label: "نمایش همهٔ وضعیت‌ها",
          }}
          filters={
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">وضعیت</p>
                <Select
                  aria-label="فیلتر وضعیت"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full"
                  disabled={allStatuses}
                >
                  {STATUS_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_FA[value].label}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStatus("pending");
                  setAllStatuses(false);
                }}
              >
                بازگشت به صف تأیید
              </Button>
            </div>
          }
        />

        <ListError error={list.error} />
        {list.loading ? (
          <ListLoading label="در حال بارگذاری نظرها" />
        ) : list.items.length === 0 ? (
          <EmptyState
            title="نظری در این صف نیست"
            body="همهٔ نظرها بررسی شده‌اند یا فیلتر دیگری را انتخاب کنید."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">دانشجو</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">دوره</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">امتیاز</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">متن نظر</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">تاریخ</TableHead>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">وضعیت</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((review) => {
                const meta = STATUS_FA[review.status] ?? {
                  label: review.status,
                  tone: "neutral" as const,
                };
                const open = expanded === review.id;
                return (
                  <React.Fragment key={review.id}>
                    <TableRow>
                      <TableCell className="text-start whitespace-normal">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-tint text-xs font-semibold text-accent-strong">
                            {(review.author_name || "؟").trim().slice(0, 1)}
                          </span>
                          <span className="truncate font-medium text-foreground">
                            {review.author_name || "دانشجو"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        <span className="block max-w-40 truncate">{review.course_title}</span>
                      </TableCell>
                      <TableCell className="text-start">
                        <span className="inline-flex items-center gap-0.5 text-foreground">
                          <Star className="size-3.5 fill-warning text-warning" />
                          {fa(review.rating)}
                        </span>
                      </TableCell>
                      <TableCell className="text-start whitespace-normal">
                        <span className="block max-w-72 truncate text-muted-foreground">{review.body}</span>
                      </TableCell>
                      <TableCell className="text-start text-muted-foreground">
                        {review.submitted_at ? formatJalali(new Date(review.submitted_at)) : "—"}
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
                            onClick={() => setExpanded(open ? null : review.id)}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                          </Button>
                          <RowMenu
                            label={`کنش‌های نظر ${review.author_name}`}
                            items={[
                              {
                                label: "تأیید نظر",
                                icon: <Check />,
                                disabled: review.status === "approved" || busy === review.id,
                                onSelect: () => void moderate(review, true),
                              },
                              {
                                label: "رد نظر",
                                icon: <X />,
                                variant: "destructive",
                                disabled: review.status === "rejected" || busy === review.id,
                                onSelect: () => void moderate(review, false),
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <ListDetailRow colSpan={7}>
                        <DetailGrid>
                          <DetailItem label="دانشجو">{review.author_name || "—"}</DetailItem>
                          <DetailItem label="دوره">{review.course_title}</DetailItem>
                          <DetailItem label="امتیاز">{fa(review.rating)} از ۵</DetailItem>
                          <DetailItem label="زمان ارسال">
                            {review.submitted_at ? formatJalali(new Date(review.submitted_at)) : "—"}
                          </DetailItem>
                          <DetailItem label="زمان تأیید">
                            {review.approved_at ? formatJalali(new Date(review.approved_at)) : "—"}
                          </DetailItem>
                          <DetailItem label="شناسه">
                            <span dir="ltr" className="text-xs">
                              {review.id.slice(0, 8)}…
                            </span>
                          </DetailItem>
                        </DetailGrid>
                        <DetailSection title="متن نظر">
                          <DetailCard title={review.body}>
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                loading={busy === review.id}
                                onClick={() => void moderate(review, true)}
                              >
                                <Check />
                                تأیید
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                loading={busy === review.id}
                                onClick={() => void moderate(review, false)}
                              >
                                <X />
                                رد
                              </Button>
                            </div>
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
    </div>
  );
}
