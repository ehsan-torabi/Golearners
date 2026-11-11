import { api } from "@/lib/api";

const BASE = process.env.SITE_URL ?? "http://localhost:3000";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ISR: a fresh feed every 10 minutes is plenty for RSS readers
export const revalidate = 600;

export async function GET() {
  let items: { slug: string; title: string; excerpt?: string | null; published_at?: string | null }[] = [];
  try {
    const res = await api<{ data: unknown[] }>("/blog/posts?sort=newest&per_page=40");
    items = (res.data as any[]) as any;
  } catch {
    items = [];
  }

  const body = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>گوLearn مجله</title>
  <link>${BASE}</link>
  <description>یادداشت‌های آموزشی درباره برنامه‌نویسی به فارسی.</description>
  <language>fa-IR</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml" />
  ${items
    .map(
      (i) => `
  <item>
    <title>${esc(i.title || "")}</title>
    <link>${BASE}/blog/${encodeURIComponent(i.slug)}</link>
    <guid isPermaLink="false">${BASE}/blog/${encodeURIComponent(i.slug)}</guid>
    <description>${esc(i.excerpt || "")}</description>
    ${i.published_at ? `<pubDate>${new Date(i.published_at).toUTCString()}</pubDate>` : ""}
  </item>`,
    )
    .join("")}
</channel>
</rss>`;

  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
