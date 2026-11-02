import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import type { Metadata } from "next";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { api, LEVEL_FA, type CourseSummary } from "@/lib/api";
import { SitePagination } from "@/components/site/pagination";
import { fa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "دوره‌ها",
  description: "فهرست کامل دوره‌های برنامه‌نویسی گوLearn، مقدماتی تا پیشرفته.",
  alternates: { canonical: "/courses" },
};

export const revalidate = 600;

type Category = { id: string; slug: string; title: string };

interface Props {
  searchParams: Promise<{ category?: string; level?: string; q?: string; page?: string }>;
}

const PER_PAGE = 24;

export default async function CoursesPage({ searchParams }: Props) {
  const { category, level, q, page: pageParam } = await searchParams;
  const wanted = Math.max(1, Number(pageParam) || 1);

  const filterParams = new URLSearchParams({ per_page: String(PER_PAGE) });
  if (category) filterParams.set("category", category);
  if (level) filterParams.set("level", level);
  if (q) filterParams.set("q", q);

  let courses: CourseSummary[] = [];
  let categories: Category[] = [];
  let total = 0;
  try {
    const query = new URLSearchParams(filterParams);
    query.set("page", String(wanted));
    const [c, cats] = await Promise.all([
      api<{ data: CourseSummary[]; meta: { total: number } }>(`/courses?${query}`),
      api<{ data: Category[] }>("/categories"),
    ]);
    courses = c.data ?? [];
    categories = cats.data ?? [];
    total = c.meta?.total ?? 0;
  } catch {
    courses = []; // shell renders; ISR retries on next request
  }

  // the API returns an empty page past the end; walk the visitor back to the
  // last real page instead of showing a blank grid
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(wanted, pages);
  if (page !== wanted && courses.length === 0 && total > 0) {
    try {
      const retry = new URLSearchParams(filterParams);
      retry.set("page", String(page));
      const c = await api<{ data: CourseSummary[]; meta: { total: number } }>(`/courses?${retry}`);
      courses = c.data ?? [];
    } catch {
      courses = [];
    }
  }

  const filtered = Boolean(category || level || q);

  return (
    <div className="space-y-8">
      <SiteBreadcrumb items={[{ label: "خانه", href: "/" }, { label: "دوره‌ها" }]} />
      <header className="reveal">
        <h1 className="font-semibold text-3xl">دوره‌ها</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
          هر دوره ویدیویی، پروژه‌محور و با دسترسی مادام‌العمر. سطح و موضوع را انتخاب کن.
        </p>
      </header>

      {/* GET form: filtering works without JS and is shareable via URL */}
      <form method="get" action="/courses" className="flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1.5 block text-sm font-medium">
            جست‌وجو
          </label>
          <Input id="q" name="q" defaultValue={q ?? ""} placeholder="مثلاً گولنگ" />
        </div>
        <div className="w-40">
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium">
            موضوع
          </label>
          <Select id="category" name="category" defaultValue={category ?? ""}>
            <option value="">همه موضوع‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <label htmlFor="level" className="mb-1.5 block text-sm font-medium">
            سطح
          </label>
          <Select id="level" name="level" defaultValue={level ?? ""}>
            <option value="">همه سطح‌ها</option>
            {Object.entries(LEVEL_FA).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit">اعمال فیلتر</Button>
      </form>

      {courses.length === 0 ? (
        <EmptyState
          title={filtered ? "با این فیلترها دوره‌ای پیدا نشد" : "هنوز دوره‌ای منتشر نشده است"}
          body={
            filtered
              ? "فیلترها را ساده‌تر کن یا عبارت دیگری جست‌وجو کن."
              : "اولین دوره‌ها به‌زودی منتشر می‌شوند."
          }
          actionHref="/courses"
          actionLabel={filtered ? "حذف فیلترها" : undefined}
        />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {fa(total)} دوره · صفحهٔ {fa(page)} از {fa(pages)}
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
          <SitePagination
            page={page}
            totalPages={pages}
            basePath="/courses"
            params={{ category, level, q }}
          />
        </>
      )}
    </div>
  );
}
