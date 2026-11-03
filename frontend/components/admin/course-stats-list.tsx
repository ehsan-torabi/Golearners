"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, ExternalLink, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ListHeader,
  ListLoading,
  ListPagination,
  ListThumb,
  ListToolbar,
  RowMenu,
  useAdminList,
  useFacetCounts,
  type ListChip,
} from "@/components/admin/list-view";
import { fetchCourseCategories, type CourseStatsRow, type TaxonomyItem } from "@/lib/admin";
import { formatTomanFromRial, LEVEL_FA } from "@/lib/api";
import { fa, faDuration, faPercent } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  published: { label: "منتشرشده", tone: "success" },
  draft: { label: "پیش‌نویس", tone: "warning" },
  archived: { label: "بایگانی", tone: "neutral" },
};

const STATUS_VALUES = ["published", "draft", "archived"];
const LEVEL_VALUES = ["beginner", "intermediate", "advanced"];

const SORT_OPTIONS = [
  { value: "enrollments_desc", label: "پرثبت‌نام‌ترین" },
  { value: "revenue_desc", label: "پردرآمدترین" },
  { value: "watch_desc", label: "پرتماشاترین" },
  { value: "rating_desc", label: "بهترین امتیاز" },
  { value: "enrollments_asc", label: "کم‌ثبت‌نام‌ترین" },
  { value: "revenue_asc", label: "کم‌درآمدترین" },
  { value: "newest", label: "تازه‌ترین" },
  { value: "title", label: "عنوان" },
];

/**
 * The statistics table: every course with what it earned and how its
 * learners engaged. The numbers come from the API, never from a guess.
 */
export function CourseStatsList() {
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [minEnrollments, setMinEnrollments] = React.useState("");
  const [enrollmentDraft, setEnrollmentDraft] = React.useState("");
  const [sort, setSort] = React.useState("enrollments_desc");
  const [categories, setCategories] = React.useState<TaxonomyItem[]>([]);

  const filters = React.useMemo(
    () => ({
      q: search,
      status,
      level,
      category,
      sort,
      min_enrollments: minEnrollments,
    }),
    [search, status, level, category, sort, minEnrollments],
  );

  const list = useAdminList<CourseStatsRow>({ path: "/admin/course-stats", filters });
  const statusCounts = useFacetCounts({
    path: "/admin/course-stats",
    param: "status",
    filters: { q: search, level, category, min_enrollments: minEnrollments },
    values: STATUS_VALUES,
  });

  React.useEffect(() => {
    fetchCourseCategories()
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  React.useEffect(() => {
    setEnrollmentDraft(minEnrollments);
  }, [minEnrollments]);

  const commitEnrollments = () => {
    setMinEnrollments(enrollmentDraft);
  };

  const chips: ListChip[] = [];
  if (status) {
    chips.push({
      key: "status",
      label: `وضعیت: ${STATUS_FA[status]?.label ?? status}`,
      count: statusCounts[status] ?? null,
      onRemove: () => setStatus(""),
    });
  }
  if (level) {
    chips.push({
      key: "level",
      label: `سطح: ${LEVEL_FA[level as keyof typeof LEVEL_FA] ?? level}`,
      onRemove: () => setLevel(""),
    });
  }
  if (category) {
    const title = categories.find((c) => c.slug === category)?.title ?? category;
    chips.push({ key: "category", label: `دسته: ${title}`, onRemove: () => setCategory("") });
  }
  if (minEnrollments) {
    chips.push({
      key: "enrollments",
      label: `دست‌کم ${fa(minEnrollments)} دانشجو`,
      onRemove: () => setMinEnrollments(""),
    });
  }

  return (
    <div className="space-y-4">
      <ListHeader
        title="گزارش عملکرد دوره‌ها"
        count={list.loading ? null : list.total}
        unit="دوره"
        subtitle="درآمد، تماشا و پیشرفت دانشجوهای هر دوره، از داده‌های واقعی سامانه"
      />

      <Card className="p-0">
        <ListToolbar
          search={{
            value: query,
            onChange: setQuery,
            onSubmit: () => setSearch(query.trim()),
            placeholder: "عنوان یا نامک دوره",
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
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">سطح</p>
                <Select aria-label="فیلتر سطح" value={level} onChange={(e) => setLevel(e.target.value)} className="w-full">
                  <option value="">همهٔ سطوح</option>
                  {LEVEL_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {LEVEL_FA[value as keyof typeof LEVEL_FA]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">دسته‌بندی</p>
                <Select aria-label="فیلتر دسته‌بندی" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full">
                  <option value="">همهٔ دسته‌ها</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">دست‌کم دانشجو</p>
                <Input
                  inputMode="numeric"
                  aria-label="دست‌کم تعداد دانشجو"
                  placeholder="۰"
                  value={enrollmentDraft}
                  onChange={(e) => setEnrollmentDraft(e.target.value.replace(/\D/g, ""))}
                  onBlur={commitEnrollments}
                  onKeyDown={(e) => e.key === "Enter" && commitEnrollments()}
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStatus("");
                  setLevel("");
                  setCategory("");
                  setMinEnrollments("");
                }}
              >
                پاک کردن فیلترها
              </Button>
            </div>
          }
        />

        {list.loading ? (
          <ListLoading label="در حال بارگذاری آمار دوره‌ها" />
        ) : list.items.length === 0 ? (
          <EmptyState
            title="دوره‌ای با این فیلترها نیست"
            body="فیلترها را تغییر دهید تا آمار دوره‌های دیگر را ببینید."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start text-[11px] font-medium tracking-wide text-muted-foreground">دوره</TableHead>
                <TableHead className="hidden text-start text-[11px] font-medium tracking-wide text-muted-foreground sm:table-cell">دانشجو</TableHead>
                <TableHead className="hidden text-start text-[11px] font-medium tracking-wide text-muted-foreground sm:table-cell">درآمد</TableHead>
                <TableHead className="hidden text-start text-[11px] font-medium tracking-wide text-muted-foreground sm:table-cell">تماشا</TableHead>
                <TableHead className="hidden text-start text-[11px] font-medium tracking-wide text-muted-foreground sm:table-cell">امتیاز</TableHead>
                <TableHead className="hidden text-start text-[11px] font-medium tracking-wide text-muted-foreground sm:table-cell">فعال</TableHead>
                <TableHead className="hidden text-start text-[11px] font-medium tracking-wide text-muted-foreground sm:table-cell">تکمیل</TableHead>
                <TableHead className="w-14" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((c) => {
                const meta = STATUS_FA[c.status] ?? { label: c.status, tone: "neutral" as const };
                return (
                  <TableRow key={c.course_id}>
                    <TableCell className="text-start whitespace-normal">
                      <div className="flex items-center gap-3">
                        <ListThumb src={c.cover_url} alt={c.title} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/courses/${c.course_id}/stats`}
                              className="block truncate font-medium text-foreground hover:text-accent-strong"
                            >
                              {c.title}
                            </Link>
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                          </div>
                          <p className="truncate text-xs text-muted-foreground" dir="ltr">
                            /courses/{c.slug}
                          </p>
                          {/* on a phone the metric columns are gone, so the
                              numbers follow the title instead */}
                          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground sm:hidden">
                            <span>{fa(c.enrollments)} دانشجو</span>
                            <span>{c.revenue_rial > 0 ? formatTomanFromRial(c.revenue_rial) : "—"}</span>
                            <span>{c.watch_seconds > 0 ? faDuration(c.watch_seconds) : "—"}</span>
                            <span>{c.review_count > 0 ? `${fa(c.avg_rating)} از ۵` : "بدون نظر"}</span>
                            <span>تکمیل {faPercent(c.completion_pct)}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-start tabular-nums sm:table-cell">{fa(c.enrollments)}</TableCell>
                    <TableCell className="hidden text-start tabular-nums sm:table-cell">
                      {c.revenue_rial > 0 ? formatTomanFromRial(c.revenue_rial) : "—"}
                    </TableCell>
                    <TableCell className="hidden text-start tabular-nums text-muted-foreground sm:table-cell">
                      {c.watch_seconds > 0 ? faDuration(c.watch_seconds) : "—"}
                    </TableCell>
                    <TableCell className="hidden text-start tabular-nums sm:table-cell">
                      {c.review_count > 0 ? (
                        <span title={`${fa(c.review_count)} نظر`}>
                          {fa(c.avg_rating)}
                          <span className="text-xs text-muted-foreground"> / ۵</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">بدون نظر</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-start tabular-nums sm:table-cell">{fa(c.active_learners)}</TableCell>
                    <TableCell className="hidden text-start tabular-nums sm:table-cell">{faPercent(c.completion_pct)}</TableCell>
                    <TableCell className="text-start">
                      <RowMenu
                        label={`کنش‌های ${c.title}`}
                        items={[
                          { label: "آمار دوره", icon: <BarChart3 />, href: `/admin/courses/${c.course_id}/stats` },
                          { label: "ویرایش", icon: <Pencil />, href: `/admin/courses/${c.course_id}` },
                          { label: "مشاهده در سایت", icon: <ExternalLink />, href: `/courses/${c.slug}` },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
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
