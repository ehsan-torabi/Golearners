import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { VideoPlayer } from "./player";
import { cn, fa } from "@/lib/utils";

export const metadata: Metadata = { title: "پخش دوره", robots: { index: false } };
export const dynamic = "force-dynamic";

interface LessonRow {
  id: string;
  section_id: string;
  title: string;
  position: number;
  is_preview: boolean;
  accessible: boolean;
  position_seconds: number;
  completed: boolean;
}
interface SectionRow {
  id: string;
  title: string;
  position: number;
}

/** Fetches the learner's curriculum; null means "no access", 401 means "signed out". */
async function curriculum(slug: string): Promise<{
  data: { sections: SectionRow[]; lessons: LessonRow[] } | null;
  signedOut: boolean;
}> {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  if (!access) return { data: null, signedOut: true };
  const base = process.env.API_INTERNAL ?? "http://localhost:8080";
  const res = await fetch(
    `${base}/api/v1/me/courses/${encodeURIComponent(slug)}/curriculum`,
    { headers: { Cookie: `gl_at=${access}` }, cache: "no-store" },
  );
  if (res.status === 401) return { data: null, signedOut: true };
  if (!res.ok) return { data: null, signedOut: false };
  return { data: (await res.json()) as { sections: SectionRow[]; lessons: LessonRow[] }, signedOut: false };
}

export default async function LearnCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { slug } = await params;
  const { lesson: lessonParam } = await searchParams;
  const { data, signedOut } = await curriculum(decodeURIComponent(slug));
  /* no session (or an expired one): send the visitor to the login form with
     a return path — a bare 404 would hide the reason */
  if (signedOut) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/courses/${slug}`)}`);
  }
  /* signed in but the course is unknown or not owned: an honest state, not a
     404 — the learner needs the courses list, not a missing page */
  if (!data) {
    return (
      <Card className="mx-auto max-w-md p-10 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="mt-4 font-semibold text-lg">دسترسی به این دوره فعال نیست</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          این دوره را نخریده‌اید یا نشانی آن درست نیست. از فهرست دوره‌های خود ادامه دهید.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <ButtonLink href="/dashboard">آموزش‌های من</ButtonLink>
          <ButtonLink href="/courses" variant="outline">
            فهرست دوره‌ها
          </ButtonLink>
        </div>
      </Card>
    );
  }

  /* the sidebar links here with ?lesson=; anything not accessible falls back to the first */
  const requested = data.lessons.find((l) => l.id === lessonParam && l.accessible);
  const current = requested ?? data.lessons.find((l) => l.accessible);
  if (!current) {
    return (
      <Card className="mx-auto max-w-md p-10 text-center text-muted-foreground">
        دسترسی به این دوره فعال نیست.
      </Card>
    );
  }

  const sections = [...data.sections].sort((a, b) => a.position - b.position);
  const base = `/dashboard/courses/${encodeURIComponent(slug)}`;
  const doneCount = data.lessons.filter((l) => l.completed).length;
  const progressPct = data.lessons.length
    ? Math.round((doneCount / data.lessons.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          پیشرفت در حین پخش به‌صورت خودکار ذخیره می‌شود.
        </p>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-accent-strong transition-colors hover:text-primary-hover"
        >
          بازگشت به آموزش‌های من
        </Link>
      </div>

      {/* player layout, «پخش دوره» style: the syllabus card sits at the reading
          start (right in RTL) beside the video, like the reference player */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit lg:sticky lg:top-20">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-line bg-muted/60 px-4 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-semibold text-base">سرفصل‌ها</h2>
                <span className="text-xs text-muted-foreground">
                  {fa(doneCount)} از {fa(data.lessons.length)} درس
                </span>
              </div>
              <div
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-accent"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="پیشرفت شما"
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <ol className="max-h-[70vh] overflow-y-auto p-2 text-sm">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <p className="px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground">{sec.title}</p>
                  <ul>
                    {data.lessons
                      .filter((l) => l.section_id === sec.id)
                      .map((l) =>
                        l.accessible ? (
                          <li key={l.id}>
                            <Link
                              href={`${base}?lesson=${l.id}`}
                              aria-current={l.id === current.id ? "true" : undefined}
                              className={`flex items-center gap-2.5 rounded-field px-2 py-2 transition-colors duration-(--motion) ease-motion ${
                                l.id === current.id
                                  ? "bg-primary-tint font-medium text-accent-strong"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              <LessonMark done={l.completed} active={l.id === current.id} />
                              <span className="min-w-0 flex-1 truncate">{l.title}</span>
                            </Link>
                          </li>
                        ) : (
                          <li key={l.id}>
                            <span className="flex items-center gap-2.5 rounded-field px-2 py-2 text-muted-foreground/60">
                              <Lock className="size-3.5 shrink-0" aria-hidden />
                              <span className="min-w-0 flex-1 truncate">{l.title}</span>
                              <span className="sr-only">(قفل‌شده)</span>
                            </span>
                          </li>
                        ),
                      )}
                  </ul>
                </li>
              ))}
            </ol>
          </Card>
        </aside>

        <div className="space-y-4">
          <VideoPlayer
            key={current.id}
            lessonId={current.id}
            title={current.title}
            startAt={current.position_seconds}
          />
          <h1 className="font-semibold text-xl leading-8">{current.title}</h1>
          <p className="text-sm text-muted-foreground">درس {fa(current.position)}</p>
        </div>
      </div>
    </div>
  );
}

/* row mark: a green check when the lesson is done, a play mark otherwise */
function LessonMark({ done, active }: { done: boolean; active: boolean }) {
  if (done) {
    return (
      <span aria-label="تمام‌شده" className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-success-bg">
        <svg aria-hidden viewBox="0 0 16 16" className="size-3 text-success-text" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 8.5 3.5 3.5L13 4.5" />
        </svg>
      </span>
    );
  }
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn("size-4 shrink-0", active ? "fill-primary text-primary" : "fill-muted-foreground/40 text-muted-foreground/40")}
    >
      <path d="M4 2.5v11l9-5.5-9-5.5Z" />
    </svg>
  );
}
