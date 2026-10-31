import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatTomanFromRial, LEVEL_FA, type CourseSummary } from "@/lib/api";
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
  try {
    const res = await fetch(`${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/me/courses`, {
      headers: { Cookie: `gl_at=${access}` },
      cache: "no-store",
    });
    if (res.status === 401) authError = true;
    else if (res.ok) {
      const body = (await res.json()) as { data: MyCourse[] };
      courses = body.data ?? [];
    }
  } catch {
    authError = false;
  }

  if (authError) {
    return (
      <Card className="mx-auto max-w-md p-10 text-center">
        <p className="text-foreground">برای دیدن داشبورد ابتدا وارد شوید.</p>
        <ButtonLink href="/login" className="mt-5">
          ورود به حساب
        </ButtonLink>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl">دوره‌های من</h1>
      {courses.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          هنوز دوره‌ای خریداری نکرده‌اید.
          <div className="mt-5">
            <ButtonLink href="/courses">مشاهده دوره‌ها</ButtonLink>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {courses.map((mc) => (
            <Card key={mc.course.id} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base">
                    <Link
                      href={`/dashboard/courses/${encodeURIComponent(mc.course.slug)}`}
                      className="hover:text-primary"
                    >
                      {mc.course.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {LEVEL_FA[mc.course.level]} • {formatTomanFromRial(mc.course.price_rial)}
                  </p>
                </div>
                <span className="text-sm font-medium text-primary">{fa(mc.progress_pct)}٪</span>
              </div>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={mc.progress_pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${mc.progress_pct}%` }} />
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


