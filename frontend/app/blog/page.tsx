import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

export const metadata: Metadata = {
  title: "وبلاگ",
  description: "مقالات آموزش برنامه‌نویسی به فارسی.",
  alternates: { canonical: "/blog" },
};
export const revalidate = 600;

interface Post {
  slug: string; title: string; excerpt: string;
  published_at: string | null; reading_minutes: number;
}

export default async function BlogPage() {
  let posts: Post[] = [];
  try {
    const res = await api<{ data: Post[] }>("/blog/posts?per_page=20");
    posts = res.data ?? [];
  } catch {
    posts = [];
  }
  return (
    <div className="space-y-8">
      <header className="reveal border-b border-line pb-8">
        <h1 className="font-display text-3xl">وبلاگ</h1>
        <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
          یادداشت‌های آموزشی درباره برنامه‌نویسی، از مقدمات تا نکته‌های حرفه‌ای.
        </p>
      </header>

      {posts.length === 0 ? (
        <EmptyState
          title="هنوز مقاله‌ای منتشر نشده است"
          body="نوشته‌های تازه به‌زودی همین‌جا منتشر می‌شوند."
        />
      ) : (
        /* editorial dated list, deliberately not a card grid (RHYTHM 3) */
        <ul className="divide-y divide-line">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${encodeURIComponent(p.slug)}`} className="group flex flex-col gap-2 py-6 sm:flex-row sm:items-baseline sm:gap-8">
                <time className="w-32 shrink-0 text-xs text-muted-foreground" dateTime={p.published_at ?? undefined}>
                  {p.published_at ? formatJalali(new Date(p.published_at)) : ""}
                </time>
                <div>
                  <h2 className="font-display text-xl leading-9 text-foreground transition-colors duration-(--motion) ease-motion group-hover:text-accent-strong">
                    {p.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-7 text-muted-foreground">{p.excerpt}</p>
                  {p.reading_minutes > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">{fa(p.reading_minutes)} دقیقه مطالعه</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
