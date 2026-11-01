"use client";

import * as React from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ApiError,
  adminDeleteCourse,
  adminPublishCourse,
  fetchAdmin,
  fetchCourseCategories,
  type TaxonomyItem,
} from "@/lib/admin";
import { formatTomanFromRial, LEVEL_FA, type CourseSummary } from "@/lib/api";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  published: { label: "منتشرشده", tone: "success" },
  draft: { label: "پیش‌نویس", tone: "warning" },
  archived: { label: "بایگانی", tone: "neutral" },
};

const FILTERS = [
  { value: "", label: "همه" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "archived", label: "بایگانی" },
];

export default function AdminCoursesPage() {
  const [courses, setCourses] = React.useState<CourseSummary[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [featured, setFeatured] = React.useState(false);
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [categories, setCategories] = React.useState<TaxonomyItem[]>([]);
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [removing, setRemoving] = React.useState<CourseSummary | null>(null);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (status) params.set("status", status);
      if (level) params.set("level", level);
      if (category) params.set("category", category);
      if (search) params.set("q", search);
      params.set("sort", sort);
      if (featured) params.set("featured", "1");
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);
      const res = await fetchAdmin<{ data: CourseSummary[]; meta: { total: number } }>(
        `/admin/courses?${params}`,
      );
      setCourses(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت فهرست دوره‌ها");
    } finally {
      setLoaded(true);
    }
  }, [page, status, level, category, sort, featured, minPrice, maxPrice, search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    fetchCourseCategories()
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  async function togglePublish(course: CourseSummary) {
    setError("");
    setBusy(course.id);
    try {
      await adminPublishCourse(course.id, course.status !== "published");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!removing) return;
    setError("");
    setBusy(removing.id);
    try {
      await adminDeleteCourse(removing.id);
      setRemoving(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در حذف دوره");
    } finally {
      setBusy("");
    }
  }

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="reveal text-xl leading-7 text-foreground">دوره‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loaded ? `${fa(total)} دوره ثبت شده است.` : "در حال شمارش دوره‌ها…"}
          </p>
        </div>
        <ButtonLink href="/admin/courses/new">دورهٔ تازه</ButtonLink>
      </header>

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-variant px-4 py-3">
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

          <form
            className="ms-auto flex flex-wrap items-end gap-3"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(query.trim());
              setPage(1);
            }}
          >
            <div>
              <label htmlFor="course-q" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                جست‌وجو
              </label>
              <Input
                id="course-q"
                value={query}
                placeholder="عنوان یا نامک دوره"
                className="w-52"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="course-level" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                سطح
              </label>
              <Select
                id="course-level"
                value={level}
                className="w-32"
                onChange={(e) => {
                  setLevel(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">همهٔ سطوح</option>
                <option value="beginner">مقدماتی</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">پیشرفته</option>
              </Select>
            </div>
            <div>
              <label htmlFor="course-cat" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                دسته‌بندی
              </label>
              <Select
                id="course-cat"
                value={category}
                className="w-36"
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">همهٔ دسته‌ها</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="course-sort" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                ترتیب
              </label>
              <Select
                id="course-sort"
                value={sort}
                className="w-36"
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="newest">تازه‌ترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="title">عنوان</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
                <option value="popular">ویژه و پرطرفدار</option>
              </Select>
            </div>
            <div>
              <label htmlFor="course-min" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                قیمت از (تومان)
              </label>
              <Input
                id="course-min"
                dir="ltr"
                inputMode="numeric"
                value={minPrice}
                className="w-28"
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="course-max" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                تا (تومان)
              </label>
              <Input
                id="course-max"
                dir="ltr"
                inputMode="numeric"
                value={maxPrice}
                className="w-28"
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="flex h-8 items-center gap-2">
              <Checkbox
                id="course-featured"
                checked={featured}
                onCheckedChange={(v) => {
                  setFeatured(v);
                  setPage(1);
                }}
              />
              <label htmlFor="course-featured" className="text-sm">
                فقط ویژه‌ها
              </label>
            </div>
            <Button type="submit" variant="outline">
              اعمال
            </Button>
          </form>
        </div>

        {!loaded ? (
          <div className="space-y-3 p-6" aria-label="در حال بارگذاری فهرست دوره‌ها">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-5 w-2/5 animate-pulse rounded bg-muted" />
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            title="دوره‌ای با این فیلترها نیست"
            body="فیلترها را تغییر دهید یا دورهٔ تازه‌ای بسازید."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">دوره</TableHead>
                <TableHead className="text-start">سطح</TableHead>
                <TableHead className="text-start">قیمت</TableHead>
                <TableHead className="text-start">وضعیت</TableHead>
                <TableHead className="text-start">کنش‌ها</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => {
                const statusMeta = STATUS_FA[c.status] ?? { label: c.status, tone: "neutral" as const };
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-start">
                      <Link
                        href={`/courses/${encodeURIComponent(c.slug)}`}
                        className="font-medium text-foreground hover:text-accent-strong"
                      >
                        {c.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                        /courses/{c.slug}
                      </p>
                    </TableCell>
                    <TableCell className="text-start text-muted-foreground">
                      {LEVEL_FA[c.level] ?? c.level}
                    </TableCell>
                    <TableCell className="text-start">
                      {c.price_rial === 0 ? "رایگان" : formatTomanFromRial(c.price_rial)}
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-start">
                      <div className="flex flex-wrap items-center gap-1">
                        <ButtonLink size="sm" variant="outline" href={`/admin/courses/${c.id}`}>
                          ویرایش
                        </ButtonLink>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy === c.id}
                          onClick={() => void togglePublish(c)}
                        >
                          {c.status === "published" ? "لغو انتشار" : "انتشار"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRemoving(c)}>
                          حذف
                        </Button>
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

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دوره</AlertDialogTitle>
            <AlertDialogDescription>
              «{removing?.title}» حذف می‌شود و در فهرست عمومی دیده نخواهد شد. دسترسی خریداران پیشین
              باقی می‌ماند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={busy === removing?.id}
              onClick={() => void remove()}
            >
              حذف دوره
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
