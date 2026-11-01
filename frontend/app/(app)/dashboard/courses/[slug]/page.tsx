import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { VideoPlayer } from "./player";
import { fa } from "@/lib/utils";

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

async function curriculum(slug: string) {
  const jar = await cookies();
  const access = jar.get("gl_at")?.value ?? "";
  const base = process.env.API_INTERNAL ?? "http://localhost:8080";
  const res = await fetch(
    `${base}/api/v1/me/courses/${encodeURIComponent(slug)}/curriculum`,
    { headers: { Cookie: `gl_at=${access}` }, cache: "no-store" },
  );
  if (!res.ok) return null;
  return (await res.json()) as { sections: SectionRow[]; lessons: LessonRow[] };
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
  const data = await curriculum(decodeURIComponent(slug));
  if (!data) notFound();

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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <VideoPlayer key={current.id} lessonId={current.id} />
        <h1 className="font-semibold text-xl leading-8">{current.title}</h1>
        <p className="text-sm text-muted-foreground">
          درس {fa(current.position)}؛ پیشرفت در حین پخش به‌صورت خودکار ذخیره می‌شود.
        </p>
      </div>

      <aside className="h-fit lg:sticky lg:top-24">
        <Card className="p-4">
          <h2 className="px-2 pb-2 font-semibold text-base">سرفصل‌ها</h2>
          <ol className="space-y-0.5 text-sm">
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
                            className={`flex items-center justify-between gap-2 rounded-field px-2 py-2 transition-colors duration-(--motion) ease-motion ${
                              l.id === current.id
                                ? "bg-muted font-medium text-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <span className="truncate">{l.title}</span>
                            {l.completed ? (
                              <svg aria-label="تمام‌شده" viewBox="0 0 16 16" className="size-3.5 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 8.5 3.5 3.5L13 4.5" />
                              </svg>
                            ) : (
                              <span className="shrink-0 text-xs">پخش</span>
                            )}
                          </Link>
                        </li>
                      ) : (
                        <li key={l.id}>
                          <span className="flex items-center justify-between gap-2 rounded-field px-2 py-2 text-muted-foreground/60">
                            <span className="truncate">{l.title}</span>
                            <span className="shrink-0 text-xs">قفل</span>
                          </span>
                        </li>
                      ),
                    )}
                </ul>
              </li>
            ))}
          </ol>
        </Card>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Link href="/dashboard" className="underline underline-offset-4 hover:text-foreground">
            بازگشت به داشبورد
          </Link>
        </p>
      </aside>
    </div>
  );
}
