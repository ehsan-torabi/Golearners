import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";

export const revalidate = 600;

interface Post {
  slug: string; title: string; excerpt: string; body_html: string;
  published_at: string | null; reading_minutes: number;
}

async function post(slug: string): Promise<Post | null> {
  try {
    return await api<Post>(`/blog/posts/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await post(decodeURIComponent(slug));
  if (!p) return { title: "مقاله پیدا نشد" };
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { title: p.title, description: p.excerpt, type: "article", locale: "fa_IR" },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await post(decodeURIComponent(slug));
  if (!p) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.excerpt,
    inLanguage: "fa-IR",
    ...(p.published_at ? { datePublished: p.published_at } : {}),
  };

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="font-display text-2xl leading-snug">{p.title}</h1>
      <p className="text-sm text-muted-foreground">
        {p.published_at ? formatJalali(new Date(p.published_at)) : ""}
        {p.reading_minutes > 0 && ` • ${fa(p.reading_minutes)} دقیقه مطالعه`}
      </p>
      <Card className="p-8 text-sm leading-8 [&_a]:text-primary [&_h2]:font-display [&_h2]:text-lg [&_pre]:overflow-x-auto [&_code]:text-xs">
        <div dangerouslySetInnerHTML={{ __html: p.body_html }} />
      </Card>
    </article>
  );
}

const fa = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
