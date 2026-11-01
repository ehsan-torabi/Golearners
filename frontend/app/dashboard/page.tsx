import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LEVEL_FA, type CourseSummary } from "@/lib/api";
import { fa } from "@/lib/utils";

export const metadata: Metadata = { title: "داشبورد", robots: { index: false } };
export const dynamic = "force-dynamic";

interface MyCourse {
  course: CourseSummary;
  granted_at: string;
  progress_pct: number;
  resume_lesson_id: string | null;
}

export default async function DashboardPage() {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  let courses: MyCourse[] = [];
  let authError = false;
  let loadError = false;
  try {
    const res = await fetch(`${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/me/courses`, {
      headers: { Cookie: `gl_at=${access}` },
      cache: "no-store",
    });
    if (res.status === 401) authError = true;
    else if (res.ok) {
      const body = (await res.json()) as { data: MyCourse[] };
      courses = body.data ?? [];
    } else loadError = true;
  } catch {
    loadError = true;
  }

  if (authError) {
    return (
      <Card className="reveal mx-auto max-w-md p-10 text-center">
        <p className="text-foreground">برای دیدن داشبورد ابتدا وارد شو.</p>
        <ButtonLink href="/login" className="mt-5">
          ورود به حساب
        </ButtonLink>
      </Card>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        className="mt-10"
        title="داشبورد بارگذاری نشد"
        body="ارتباط با سرور برقرار نشد. صفحه را دوباره باز کن؛ اگر تکرار شد، بعداً تلاش کن."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="reveal">
        <h1 className="font-display text-3xl">دوره‌های من</h1>
      </header>
      {courses.length === 0 ? (
        <EmptyState
          title="هنوز دوره‌ای نخریده‌ای"
          body="با اولین خرید، دوره اینجا اضافه می‌شود و یادگیری را از همان‌جا شروع می‌کنی."
          actionHref="/courses"
          actionLabel="دیدن دوره‌ها"
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {courses.map((mc) => (
            <Card key={mc.course.id} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg leading-8">
                    <Link
                      href={`/dashboard/courses/${encodeURIComponent(mc.course.slug)}`}
                      className="transition-colors duration-(--motion) ease-motion hover:text-accent-strong"
                    >
                      {mc.course.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{LEVEL_FA[mc.course.level]}</p>
                </div>
                <span className="font-display text-xl text-accent-strong">{fa(mc.progress_pct)}٪</span>
              </div>
              {/* progress: a real status bar, square ends (pill reserved for badges) */}
              <div
                className="mt-4 h-2 overflow-hidden rounded-field bg-muted"
                role="progressbar"
                aria-valuenow={mc.progress_pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`پیشرفت دوره ${mc.course.title}`}
              >
                <div className="h-full bg-primary" style={{ width: `${mc.progress_pct}%` }} />
              </div>
              <ButtonLink
                href={`/dashboard/courses/${encodeURIComponent(mc.course.slug)}`}
                size="sm"
                className="mt-5"
              >
                {mc.progress_pct > 0 ? "ادامه یادگیری" : "شروع دوره"}
              </ButtonLink>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
