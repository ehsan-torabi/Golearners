import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { fa } from "@/lib/utils";

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
    <article className="mx-auto max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="border-b border-line pb-6">
        <h1 className="font-display text-3xl leading-[1.35]">{p.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {p.published_at ? formatJalali(new Date(p.published_at)) : ""}
          {p.reading_minutes > 0 && ` · ${fa(p.reading_minutes)} دقیقه مطالعه`}
        </p>
      </header>
      <div
        className="prose-fa mt-8 text-[0.95rem] leading-9 [&_a]:text-accent-strong [&_a]:underline [&_blockquote]:border-e-2 [&_blockquote]:border-accent-display [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-4 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-field [&_pre]:bg-invert [&_pre]:p-4 [&_pre]:text-invert-foreground [&_code]:text-xs [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6"
        dangerouslySetInnerHTML={{ __html: p.body_html }}
      />
    </article>
  );
}
