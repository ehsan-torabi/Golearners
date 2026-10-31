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

export default async function LearnCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await curriculum(decodeURIComponent(slug));
  if (!data) notFound();

  const first = data.lessons.find((l) => l.accessible);
  if (!first) {
    return (
      <Card className="mx-auto max-w-md p-10 text-center text-muted-foreground">
        دسترسی به این دوره فعال نیست.
      </Card>
    );
  }

  const sections = [...data.sections].sort((a, b) => a.position - b.position);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <VideoPlayer lessonId={first.id} />
        <h1 className="font-display text-lg">{first.title}</h1>
        <p className="text-sm text-muted-foreground">
          درس {fa(first.position)} — در حین پخش، پیشرفت شما به‌صورت خودکار ذخیره می‌شود.
        </p>
      </div>

      <aside className="h-fit lg:sticky lg:top-24">
        <Card className="p-4">
          <h2 className="px-2 pb-2 font-display text-sm">سرفصل‌ها</h2>
          <ol className="space-y-0.5 text-sm">
            {sections.map((sec) => (
              <li key={sec.id}>
                <p className="px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground">{sec.title}</p>
                <ul>
                  {data.lessons
                    .filter((l) => l.section_id === sec.id)
                    .map((l) => (
                      <li key={l.id}>
                        <span
                          className={`flex items-center justify-between rounded-field px-2 py-2 ${
                            l.id === first.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                          }`}
                        >
                          <span className="truncate">{l.title}</span>
                          {l.completed ? (
                            <span className="text-success">✓</span>
                          ) : l.accessible ? (
                            <span className="text-xs">پخش</span>
                          ) : (
                            <span aria-label="قفل">🔒</span>
                          )}
                        </span>
                      </li>
                    ))}
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
