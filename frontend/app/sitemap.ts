import type { MetadataRoute } from "next";

const BASE = process.env.SITE_URL ?? "http://localhost:3000";
const API = process.env.API_INTERNAL ?? "http://localhost:8080";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/courses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/instructor`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];
  try {
    const [courses, posts] = await Promise.all([
      fetch(`${API}/api/v1/courses?per_page=100`).then((r) => r.json() as Promise<{ data: { slug: string }[] }>),
      fetch(`${API}/api/v1/blog/posts?per_page=100`).then((r) => r.json() as Promise<{ data: { slug: string; published_at: string | null }[] }>),
    ]);
    return [
      ...staticPages,
      ...((courses.data ?? []).map((c) => ({
        url: `${BASE}/courses/${encodeURIComponent(c.slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))),
      ...((posts.data ?? []).map((p) => ({
        url: `${BASE}/blog/${encodeURIComponent(p.slug)}`,
        lastModified: p.published_at ? new Date(p.published_at) : undefined,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))),
    ];
  } catch {
    return staticPages;
  }
}
