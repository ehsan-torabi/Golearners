"use client";

import Link from "next/link";
import { fa } from "@/lib/utils";
import { formatJalali } from "@/lib/jalali";

export type PostCardShape = {
  slug: string;
  title: string;
  excerpt?: string;
  cover_url?: string | null;
  category?: { slug: string; title: string } | null;
  published_at?: string | null;
  reading_minutes?: number;
  views?: number;
  featured?: boolean;
  series_part?: number | null;
};

/** Compact cover: real media from the API origin; no next/image remotePatterns. */
export function Cover({ post, priority = false }: { post: PostCardShape; priority?: boolean }) {
  if (post.cover_url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element -- media served from the API
         origin; next/image would need remotePatterns per deployment */
      <img
        src={post.cover_url}
        alt={`تصویر مقالهٔ ${post.title}`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className="media-dim aspect-video w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
      />
    );
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-primary-tint">
      <span aria-hidden className="font-display text-4xl font-semibold text-primary/40">
        {post.title.slice(0, 2)}
      </span>
    </div>
  );
}

/** Meta row under every card: category chip → date · reading time · views. */
export function PostMeta({ post }: { post: PostCardShape }) {
  return (
    <p className="mt-auto border-t border-border-variant pt-3 text-xs text-muted-foreground flex items-center gap-1.5">
      {post.category && (
        <span className="w-fit rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong">
          {post.category.title}
        </span>
      )}
      {post.published_at && <time>{formatJalali(new Date(post.published_at))}</time>}
      {(post.reading_minutes ?? 0) > 0 && (
        <>
          <span className="mx-1 text-[0.8em] opacity-60">·</span>
          <>{fa(post.reading_minutes ?? 0)} دقیقه مطالعه</>
        </>
      )}
      {post.views != null && post.views > 0 && (
        <>
          <span className="mx-1 text-[0.8em] opacity-60">·</span>
          <>{fa(post.views)} بازدید</>
        </>
      )}
    </p>
  );
}

/** Cover story for the newest/featured item (faradars hero-cards: wide cover). */
export function FeaturedCard({ post }: { post: PostCardShape }) {
  return (
    <article
      className="group overflow-hidden rounded-surface border border-line bg-card transition-[box-shadow,border-color] duration-300 ease-out hover:border-primary/35 hover:shadow-raise"
    >
      <Link
        href={`/blog/${encodeURIComponent(post.slug)}`}
        className="grid items-stretch sm:grid-cols-[2fr_3fr] gap-0"
        aria-label={post.title}
      >
        <div className="overflow-hidden aspect-[16/9]">
          <Cover post={post} priority />
        </div>
        <div className="flex flex-col justify-between gap-3 p-6 md:p-8">
          {post.featured && (
            <span className="w-fit rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-medium">
              ویژه
            </span>
          )}
          {post.category && (
            <span className="mt-1 w-fit rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong">
              {post.category.title}
            </span>
          )}
          <h2 className="text-xl font-semibold leading-9 text-foreground transition-colors duration-300 ease-out group-hover:text-accent-strong md:text-2xl">
            {post.title}
          </h2>
          {post.excerpt && <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>}
          <PostMeta post={post} />
        </div>
      </Link>
    </article>
  );
}

/** Uniform card for the rest of the list. */
export function PostCard({ post }: { post: PostCardShape }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-surface border border-line bg-card transition-[box-shadow,border-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-raise">
      <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="flex h-full flex-col" aria-label={post.title}>
        <div className="overflow-hidden aspect-[16/9]">
          <Cover post={post} />
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-5">
          {post.category && (
            <span className="w-fit rounded-full bg-primary-tint px-2.5 py-0.5 text-xs font-medium text-accent-strong">
              {post.category.title}
            </span>
          )}
          <h2 className="line-clamp-2 text-[15px] font-medium leading-7 text-foreground transition-colors duration-300 ease-out group-hover:text-accent-strong">
            {post.title}
          </h2>
          {post.excerpt && <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">{post.excerpt}</p>}
          <PostMeta post={post} />
        </div>
      </Link>
    </article>
  );
}
