"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MediaField } from "@/components/admin/media-field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  adminAIGenerate,
  adminCreatePost,
  adminGetPost,
  adminListSeries,
  adminUpdatePost,
  fetchBlogTaxonomy,
  type AdminSeries,
  type PostPayload,
  type TaxonomyItem,
} from "@/lib/admin";

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  body_html: string;
  category_id: string | null;
  series_id: string | null;
  series_part: string;
  featured: boolean;
  og_image_media_id: string | null;
  tag_titles: string[];
  reading_minutes: string;
  cover_media_id: string | null;
  meta_title: string;
  meta_description: string;
}

const EMPTY: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  body_html: "",
  category_id: null,
  series_id: null,
  series_part: "",
  featured: false,
  og_image_media_id: null,
  tag_titles: [],
  reading_minutes: "",
  cover_media_id: null,
  meta_title: "",
  meta_description: "",
};

/**
 * Blog post editor as a full page.
 * The body is a rich text editor; the raw HTML never reaches the operator.
 */
export function PostEditor({ postId }: { postId: string | null }) {
  const [form, setForm] = React.useState<PostForm>(EMPTY);
  const [categories, setCategories] = React.useState<TaxonomyItem[]>([]);
  const [series, setSeries] = React.useState<AdminSeries[]>([]);
  const [tagDraft, setTagDraft] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [aiGenerating, setAiGenerating] = React.useState(false);
  const router = useRouter();

  const set = <K extends keyof PostForm>(key: K, value: PostForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function generateAI(kind: "blog_post") {
    setError("");
    setAiGenerating(true);
    try {
      const draft = await adminAIGenerate({
        kind,
        target_type: postId ? "post" : undefined,
        target_id: postId ?? undefined,
        instructions: `موضوع نوشته: "${form.title}".${
          form.body_html ? " متن فعلی را حفظ کنید و فقط بهبود بخشید." : ""
        }`,
      });
      setAiGenerating(false);
      router.push("/admin/ai");
    } catch (err) {
      setAiGenerating(false);
      setError(err instanceof Error ? err.message : "تولید با هوش مصنوعی ناموفق بود.");
    }
  }

  React.useEffect(() => {
    setError("");
    setSaved(false);
    setForm(EMPTY);
    setTagDraft("");
    fetchBlogTaxonomy()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]));
    adminListSeries()
      .then((res) => setSeries(res.data ?? []))
      .catch(() => setSeries([]));
    if (!postId) return;
    setLoading(true);
    adminGetPost(postId)
      .then((res) => {
        const p = res.data;
        setForm({
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          body_html: p.body_html,
          category_id: p.category_id,
          series_id: p.series_id ?? null,
          series_part: p.series_part != null ? String(p.series_part) : "",
          featured: p.featured ?? false,
          og_image_media_id: p.og_image_media_id ?? null,
          tag_titles: p.tag_titles ?? [],
          reading_minutes: p.reading_minutes ? String(p.reading_minutes) : "",
          cover_media_id: p.cover_media_id,
          meta_title: p.meta_title ?? "",
          meta_description: p.meta_description ?? "",
        });
      })
      .catch(() => setError("دریافت اطلاعات نوشته ناموفق بود."))
      .finally(() => setLoading(false));
  }, [postId]);

  function addTag() {
    const title = tagDraft.trim();
    if (!title) return;
    if (!form.tag_titles.includes(title)) {
      set("tag_titles", [...form.tag_titles, title]);
    }
    setTagDraft("");
  }

  async function save() {
    setError("");
    setSaved(false);
    setSaving(true);
    const minutes = Number(form.reading_minutes || "0");
    const payload: PostPayload = {
      title: form.title.trim(),
      slug: form.slug.trim() || form.title.trim(),
      excerpt: form.excerpt,
      body_html: form.body_html,
      cover_media_id: form.cover_media_id,
      category_id: form.category_id,
      series_id: form.series_id,
      series_part: form.series_id && form.series_part.trim() ? Number(form.series_part) : null,
      featured: form.featured,
      og_image_media_id: form.og_image_media_id,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      tag_titles: form.tag_titles,
      reading_minutes: Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0,
    };
    try {
      if (postId) {
        await adminUpdatePost(postId, payload);
      } else {
        await adminCreatePost(payload);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیرهٔ نوشته ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-label="در حال بارگذاری نوشته">
        <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-64 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/posts" className="text-sm text-muted-foreground hover:text-foreground">
          ← بازگشت به فهرست نوشته‌ها
        </Link>
        {saved && <Badge tone="success">ذخیره شد</Badge>}
        <Button
          type="button"
          size="sm"
          onClick={() => generateAI("blog_post")}
          disabled={aiGenerating}
          className="h-8"
        >
          {aiGenerating ? "در حال تولید…" : "تولید با هوش مصنوعی"}
        </Button>
      </header>

      {error && <Alert>{error}</Alert>}

      <Card className="p-0">
        <Tabs defaultValue="meta">
          <div className="border-b border-border-variant px-5">
            <TabsList variant="line" className="h-11 w-full justify-start gap-5 p-0">
              <TabsTrigger value="meta">اطلاعات</TabsTrigger>
              <TabsTrigger value="body">بدنه</TabsTrigger>
              <TabsTrigger value="media">رسانه و سئو</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-5">
            <TabsContent value="meta" className="space-y-4">
              <Field label="عنوان" htmlFor="p-title" required>
                <Input id="p-title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="نامک" htmlFor="p-slug" hint="خالی = از عنوان.">
                  <Input id="p-slug" dir="ltr" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
                </Field>
                <Field label="دسته‌بندی" htmlFor="p-category">
                  <Select
                    id="p-category"
                    value={form.category_id ?? ""}
                    onChange={(e) => set("category_id", e.target.value || null)}
                  >
                    <option value="">انتخاب نشده</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="زمان مطالعه (دقیقه)" htmlFor="p-reading" hint="خالی = از طول متن.">
                  <Input
                    id="p-reading"
                    dir="ltr"
                    inputMode="numeric"
                    value={form.reading_minutes}
                    onChange={(e) => set("reading_minutes", e.target.value)}
                  />
                </Field>
                <Field label="سری مطالب" htmlFor="p-series" hint="برای مجموعه‌های چندقسمتی.">
                  <Select
                    id="p-series"
                    value={form.series_id ?? ""}
                    onChange={(e) => set("series_id", e.target.value || null)}
                  >
                    <option value="">بدون سری</option>
                    {series.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </Select>
                </Field>
                {form.series_id && (
                  <Field label="شمارهٔ قسمت" htmlFor="p-series-part" hint="مثلاً ۰ برای مقدمه.">
                    <Input
                      id="p-series-part"
                      dir="ltr"
                      inputMode="numeric"
                      value={form.series_part}
                      onChange={(e) => set("series_part", e.target.value)}
                    />
                  </Field>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={form.featured}
                  onCheckedChange={(v) => set("featured", v === true)}
                  aria-label="نمایش به‌عنوان مقالهٔ ویژه"
                />
                مقالهٔ ویژه (نمایش در صفحهٔ اصلی)
              </label>
              <Field label="خلاصه" htmlFor="p-excerpt" hint="در فهرست وبلاگ و نتایج جست‌وجو نمایش داده می‌شود.">
                <Textarea
                  id="p-excerpt"
                  value={form.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                />
              </Field>
              <Field label="برچسب‌ها" htmlFor="p-tags" hint="با Enter هر برچسب را اضافه کنید.">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="p-tags"
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      افزودن
                    </Button>
                  </div>
                  {form.tag_titles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.tag_titles.map((tag) => (
                        <Badge key={tag} tone="info">
                          {tag}
                          <button
                            type="button"
                            aria-label={`حذف برچسب ${tag}`}
                            className="ms-1 cursor-pointer text-info-text"
                            onClick={() =>
                              set(
                                "tag_titles",
                                form.tag_titles.filter((t) => t !== tag),
                              )
                            }
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
            </TabsContent>

            <TabsContent value="body" className="space-y-2">
              <label htmlFor="p-body" className="block text-sm font-medium text-foreground">
                متن نوشته
              </label>
              <RichTextEditor
                id="p-body"
                value={form.body_html}
                onChange={({ html }) => set("body_html", html)}
                placeholder="متن نوشته را اینجا بنویسید…"
                variant="advanced"
                minHeight="30rem"
              />
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <MediaField
                id="p-cover"
                label="تصویر کاور"
                kind="image"
                value={form.cover_media_id}
                onChange={(v) => set("cover_media_id", v)}
                uploaderLabel="بارگذاری تصویر کاور"
              />
              <MediaField
                id="p-og"
                label="تصویر اشتراک‌گذاری (og:image)"
                kind="image"
                value={form.og_image_media_id}
                onChange={(v) => set("og_image_media_id", v)}
                uploaderLabel="بارگذاری تصویر اشتراک‌گذاری"
                hint="در لینک ارسالی به تلگرام و شبکه‌های اجتماعی نمایش داده می‌شود؛ خالی = تصویر کاور."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="عنوان سئو" htmlFor="p-meta-title" hint="خالی = عنوان نوشته.">
                  <Input
                    id="p-meta-title"
                    value={form.meta_title}
                    onChange={(e) => set("meta_title", e.target.value)}
                  />
                </Field>
                <Field label="توضیح سئو" htmlFor="p-meta-desc" hint="خالی = خلاصهٔ نوشته.">
                  <Textarea
                    id="p-meta-desc"
                    value={form.meta_description}
                    onChange={(e) => set("meta_description", e.target.value)}
                  />
                </Field>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border-variant bg-background/95 py-3 backdrop-blur">
        <Button onClick={() => void save()} loading={saving} disabled={!form.title.trim()}>
          {postId ? "ذخیرهٔ نوشته" : "ساخت نوشته"}
        </Button>
      </div>
    </div>
  );
}
