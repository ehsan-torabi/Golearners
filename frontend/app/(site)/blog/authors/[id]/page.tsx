import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { PostCard } from "@/components/blog/post-card";

interface AuthorPosts {
  id: string;
  name: string;
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    cover_url?: string | null;
    category?: { slug: string; title: string } | null;
    published_at?: string | null;
    reading_minutes?: number;
  }[];
}

async function author(id: string): Promise<AuthorPosts | null> {
  try {
    return await api<AuthorPosts>(`/blog/authors/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = await author(decodeURIComponent(id));
  if (!a) return { title: "نویسنده پیدا نشد" };
  return { title: a.name, alternates: { canonical: `/blog/authors/${id}` } };
}

export default async function BlogAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await author(decodeURIComponent(id));
  if (!a) notFound();

  return (
    <div className="space-y-8">
      <SiteBreadcrumb items={[{ label: "خانه", href: "/" }, { label: "وبلاگ", href: "/blog" }, { label: a.name }]} />

      <header className="border-b border-line pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 md:flex-nowrap">
          <h1 className="text-3xl font-semibold leading-[1.4] text-foreground md:text-4xl">{a.name}</h1>
        </div>
        <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
          {fa(a.posts.length)} مقاله از این نویسنده
        </p>
      </header>

      {a.posts.length === 0 ? (
        <div className="rounded-surface border border-line bg-card p-8 text-center text-muted-foreground">
          هیچ مقاله‌ای منتشر نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {a.posts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
