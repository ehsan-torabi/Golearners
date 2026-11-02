import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { api, LEVEL_FA, type CourseSummary } from "@/lib/api";
import { SitePagination } from "@/components/site/pagination";
import { fa, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "دوره‌ها",
  description: "فهرست کامل دوره‌های برنامه‌نویسی گوLearn، مقدماتی تا پیشرفته.",
  alternates: { canonical: "/courses" },
};

export const revalidate = 600;

type Category = { id: string; slug: string; title: string };

interface Props {
  searchParams: Promise<{ category?: string; level?: string; q?: string; sort?: string; page?: string }>;
}

const PER_PAGE = 24;

/* explore layout, «هزاران آموزش» style: a filter card at the reading start,
   sort tabs over the card grid, plain-link pagination. The filter card is one
   GET form: filtering works without JS and every state is shareable via URL. */
export default async function CoursesPage({ searchParams }: Props) {
  const { category, level, q, sort, page: pageParam } = await searchParams;
  const wanted = Math.max(1, Number(pageParam) || 1);
  const sortParam = sort === "popular" ? "popular" : "";

  const filterParams = new URLSearchParams({ per_page: String(PER_PAGE) });
  if (category) filterParams.set("category", category);
  if (level) filterParams.set("level", level);
  if (q) filterParams.set("q", q);
  if (sortParam) filterParams.set("sort", sortParam);

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

  /* sort tabs keep the active filters and restart from the first page */
  const tabHref = (nextSort?: string) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("category", category);
    if (level) sp.set("level", level);
    if (nextSort) sp.set("sort", nextSort);
    const qs = sp.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };
  const popularActive = sortParam === "popular";

  const filterCard = (
    <form method="get" action="/courses" className="space-y-5" role="search">
      <div>
        <label htmlFor="q" className="mb-1.5 block text-sm font-medium">
          جست‌وجو
        </label>
        <Input id="q" name="q" defaultValue={q ?? ""} placeholder="مثلاً گولنگ" />
      </div>
      <div>
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
      <div>
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
      <div className="flex items-center gap-2">
        <Button type="submit" className="flex-1">
          اعمال فیلتر
        </Button>
        {filtered && (
          <Link
            href="/courses"
            className="inline-flex h-10 items-center rounded-control px-3 text-sm text-muted-foreground transition-colors hover:text-destructive-text"
          >
            حذف فیلترها
          </Link>
        )}
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <SiteBreadcrumb items={[{ label: "خانه", href: "/" }, { label: "دوره‌ها" }]} />
      <header className="reveal">
        <h1 className="font-semibold text-3xl">دوره‌ها</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
          هر دوره ویدیویی، پروژه‌محور و با دسترسی مادام‌العمر. سطح و موضوع را انتخاب کن.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        {/* mobile: the filter card collapses; desktop: sticky at the reading start */}
        <aside className="h-fit lg:sticky lg:top-24">
          <details
            open
            className="group rounded-surface border border-line bg-card px-5 py-4 [&_summary]:lg:pointer-events-none"
          >
            <summary className="flex list-none items-center justify-between text-sm font-semibold text-foreground">
              فیلترها
              <span
                aria-hidden
                className="text-muted-foreground transition-transform duration-(--motion) ease-motion group-open:rotate-180 lg:hidden"
              >
                ▾
              </span>
            </summary>
            <div className="pt-5">{filterCard}</div>
          </details>
        </aside>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5">
            <div className="flex items-center gap-5 text-sm" role="group" aria-label="مرتب‌سازی بر اساس">
              <span className="text-muted-foreground">مرتب‌سازی:</span>
              <SortTab href={tabHref("popular")} active={popularActive}>
                محبوب‌ترین
              </SortTab>
              <SortTab href={tabHref()} active={!popularActive}>
                جدیدترین
              </SortTab>
            </div>
            <p className="text-xs text-muted-foreground">{fa(total)} عنوان آموزشی</p>
          </div>

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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
              <SitePagination
                page={page}
                totalPages={pages}
                basePath="/courses"
                params={{ category, level, q, sort: sortParam }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SortTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative pb-1.5 transition-colors duration-(--motion) ease-motion",
        active ? "font-medium text-accent-strong" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 -bottom-3.5 h-0.5 rounded-full bg-primary transition-opacity duration-(--motion) ease-motion",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </Link>
  );
}
