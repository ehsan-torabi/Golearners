import type { Metadata } from "next";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { api, LEVEL_FA, type CourseSummary } from "@/lib/api";
import { fa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "دوره‌ها",
  description: "فهرست کامل دوره‌های برنامه‌نویسی گوLearn، مقدماتی تا پیشرفته.",
  alternates: { canonical: "/courses" },
};

export const revalidate = 600;

type Category = { id: string; slug: string; title: string };

interface Props {
  searchParams: Promise<{ category?: string; level?: string; q?: string }>;
}

export default async function CoursesPage({ searchParams }: Props) {
  const { category, level, q } = await searchParams;
  const params = new URLSearchParams({ per_page: "24" });
  if (category) params.set("category", category);
  if (level) params.set("level", level);
  if (q) params.set("q", q);

  let courses: CourseSummary[] = [];
  let categories: Category[] = [];
  try {
    const [c, cats] = await Promise.all([
      api<{ data: CourseSummary[] }>(`/courses?${params}`),
      api<{ data: Category[] }>("/categories"),
    ]);
    courses = c.data ?? [];
    categories = cats.data ?? [];
  } catch {
    courses = []; // shell renders; ISR retries on next request
  }

  const filtered = Boolean(category || level || q);

  return (
    <div className="space-y-8">
      <header className="reveal">
        <h1 className="font-display text-3xl">دوره‌ها</h1>
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
          <p className="text-xs text-muted-foreground">{fa(courses.length)} دوره</p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
