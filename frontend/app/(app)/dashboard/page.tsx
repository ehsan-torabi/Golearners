import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMe } from "@/lib/me-server";
import { LEVEL_FA, type CourseSummary } from "@/lib/api";
import { fa } from "@/lib/utils";
import { formatJalali } from "@/lib/jalali";

export const metadata: Metadata = { title: "داشبورد", robots: { index: false } };
export const dynamic = "force-dynamic";

interface MyCourse {
  course: CourseSummary;
  granted_at: string;
  progress_pct: number;
  resume_lesson_id: string | null;
}

const ROLE_FA: Record<string, string> = { learner: "دانشجو", admin: "مدیر", instructor: "مدرس" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("");
}

export default async function DashboardPage() {
  const [me, courses] = await Promise.all([getMe(), myCourses()]);

  if (!me) {
    return (
      <EmptyState
        className="mt-10"
        title="برای دیدن داشبورد ابتدا وارد شو"
        body="پس از ورود، دوره‌ها و پیشرفت یادگیری همین‌جا دیده می‌شود."
        actionHref="/login"
        actionLabel="ورود به حساب"
      />
    );
  }

  const inProgress = courses.filter((c) => c.progress_pct > 0 && c.progress_pct < 100).length;
  const completed = courses.filter((c) => c.progress_pct >= 100).length;
  const avg = courses.length
    ? Math.round(courses.reduce((s, c) => s + c.progress_pct, 0) / courses.length)
    : 0;
  const stats: [string, string][] = [
    ["دوره‌ها", fa(courses.length)],
    ["در حال یادگیری", fa(inProgress)],
    ["تکمیل‌شده", fa(completed)],
    ["میانگین پیشرفت", fa(avg) + "٪"],
  ];

  return (
    <div className="space-y-6">
      {/* profile header, adapted from the profile-05 block with real data */}
      <Card className="reveal overflow-hidden">
        <div className="h-16 bg-primary-tint" aria-hidden />
        <div className="flex flex-col gap-4 border-b border-border-variant px-6 pb-5 sm:flex-row sm:items-end">
          <div className="-mt-9 flex items-end gap-4">
            <Avatar className="size-20 border-4 border-card">
              <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                {initials(me.full_name) || "گ"}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h1 className="text-xl leading-7 text-foreground">{me.full_name}</h1>
              <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                {me.mobile}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ms-auto sm:pb-1">
            {me.roles.map((r) => (
              <Badge key={r} tone="accent">
                {ROLE_FA[r] ?? r}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground">
              عضو از {formatJalali(new Date(me.created_at))}
            </span>
          </div>
        </div>

        {/* real learning stats */}
        <dl className="grid grid-cols-2 divide-border-variant sm:grid-cols-4 sm:divide-x sm:divide-x-reverse">
          {stats.map(([label, value]) => (
            <div key={label} className="p-5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-xl font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <section aria-labelledby="my-courses">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="my-courses" className="text-xl leading-7 text-foreground">
            دوره‌های من
          </h2>
          <ButtonLink href="/courses" variant="outline" size="sm">
            فروشگاه دوره‌ها
          </ButtonLink>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            title="هنوز دوره‌ای نخریده‌ای"
            body="با اولین خرید، دوره اینجا اضافه می‌شود و یادگیری را از همان‌جا شروع می‌کنی."
            actionHref="/courses"
            actionLabel="دیدن دوره‌ها"
          />
        ) : (
          <div className="space-y-3">
            {courses.map((mc) => (
              <Card key={mc.course.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-medium leading-6">
                      <Link
                        href={`/dashboard/courses/${encodeURIComponent(mc.course.slug)}`}
                        className="transition-colors duration-150 hover:text-accent-strong"
                      >
                        {mc.course.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        LEVEL_FA[mc.course.level],
                        mc.granted_at ? `خرید در ${formatJalali(new Date(mc.granted_at))}` : null,
                      ]
                        .filter(Boolean)
                        .join("، ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-accent-strong">
                      {fa(mc.progress_pct)}٪
                    </span>
                    <ButtonLink
                      href={`/dashboard/courses/${encodeURIComponent(mc.course.slug)}`}
                      size="sm"
                    >
                      {mc.progress_pct > 0 ? "ادامه یادگیری" : "شروع دوره"}
                    </ButtonLink>
                  </div>
                </div>
                <div
                  className="mt-4 h-2 overflow-hidden rounded-sm bg-accent"
                  role="progressbar"
                  aria-valuenow={mc.progress_pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`پیشرفت دوره ${mc.course.title}`}
                >
                  <div className="h-full bg-primary" style={{ width: `${mc.progress_pct}%` }} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

async function myCourses(): Promise<MyCourse[]> {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  try {
    const res = await fetch(`${process.env.API_INTERNAL ?? "http://localhost:8080"}/api/v1/me/courses`, {
      headers: { Cookie: `gl_at=${access}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: MyCourse[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}
