import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";
import { SiteBreadcrumb } from "@/components/site-breadcrumb";
import { PostCard } from "@/components/blog/post-card";

interface SeriesPart {
  slug: string;
  title: string;
  excerpt: string;
  cover_url?: string | null;
  category?: { slug: string; title: string } | null;
  series_part?: number | null;
  published_at?: string | null;
  reading_minutes?: number;
}
interface SeriesPayload {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  parts: SeriesPart[];
}

async function series(slug: string): Promise<SeriesPayload | null> {
  try {
    return await api<SeriesPayload>(`/blog/series/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await series(decodeURIComponent(slug));
  if (!s) return { title: "سری پیدا نشد" };
  return {
    title: s.title,
    description: s.description || `${s.parts.length} قسمت`,
    alternates: { canonical: `/blog/series/${slug}` },
  };
}

export default async function BlogSeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await series(decodeURIComponent(slug));
  if (!s) notFound();

  return (
    <div className="space-y-8">
      <SiteBreadcrumb items={[{ label: "خانه", href: "/" }, { label: "وبلاگ", href: "/blog" }, { label: s.title }]} />

      <header className="border-b border-line pb-6">
        <h1 className="text-3xl font-semibold leading-[1.4] text-foreground md:text-4xl">{s.title}</h1>
        {s.description && <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{s.description}</p>}
      </header>

      <p className="text-xs text-muted-foreground">
        {fa(s.parts.length)} قسمت · {s.parts.map((p) => p.series_part != null && fa(p.series_part)).filter(Boolean).join("، ")}
      </p>

      {s.parts.length === 0 ? (
        <div className="rounded-surface border border-line bg-card p-8 text-center text-muted-foreground">
          هیچ بخشی هنوز منتشر نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {s.parts.map((p) => (
            <PostCard key={p.slug} post={{ ...p, series_part: p.series_part ?? undefined }} />
          ))}
        </div>
      )}
    </div>
  );
}
