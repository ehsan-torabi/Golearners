import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
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
    <div className="space-y-6">
      <h1 className="font-display text-2xl">وبلاگ</h1>
      {posts.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">هنوز مقاله‌ای منتشر نشده است.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {posts.map((p) => (
            <Card key={p.slug} className="p-6">
              <a href={`/blog/${encodeURIComponent(p.slug)}`} className="group block">
                <h2 className="font-display text-base group-hover:text-primary">{p.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{p.excerpt}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {p.published_at ? formatJalali(new Date(p.published_at)) : ""}
                  {p.reading_minutes > 0 && ` • ${fa(p.reading_minutes)} دقیقه مطالعه`}
                </p>
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
