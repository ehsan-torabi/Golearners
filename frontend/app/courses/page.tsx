import type { Metadata } from "next";
import { CourseCard } from "@/components/course-card";
import { Card } from "@/components/ui/card";
import { api, type CourseSummary } from "@/lib/api";

export const metadata: Metadata = {
  title: "دوره‌ها",
  description: "فهرست کامل دوره‌های برنامه‌نویسی گوLearn — مقدماتی تا پیشرفته.",
  alternates: { canonical: "/courses" },
};

export const revalidate = 600;

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
  try {
    const res = await api<{ data: CourseSummary[] }>(`/courses?${params}`);
    courses = res.data ?? [];
  } catch {
    courses = [];
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl">دوره‌ها</h1>
        <p className="mt-1 text-sm text-muted-foreground">از صفر تا پروژه‌های واقعی.</p>
      </header>
      {courses.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          دوره‌ای با این فیلترها پیدا نشد.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
