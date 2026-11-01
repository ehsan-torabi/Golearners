"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MediaSelect } from "@/components/admin/media-select";
import {
  adminCreatePost,
  adminGetPost,
  adminUpdatePost,
  fetchBlogTaxonomy,
  type PostPayload,
  type TaxonomyItem,
} from "@/lib/admin";

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  body_html: string;
  category_id: string | null;
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
  tag_titles: [],
  reading_minutes: "",
  cover_media_id: null,
  meta_title: "",
  meta_description: "",
};

/**
 * Blog post create/edit panel.
 * The body is a rich text editor; the raw HTML never reaches the operator.
 */
export function PostEditor({
  open,
  onOpenChange,
  postId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<PostForm>(EMPTY);
  const [categories, setCategories] = React.useState<TaxonomyItem[]>([]);
  const [tagDraft, setTagDraft] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const set = <K extends keyof PostForm>(key: K, value: PostForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm(EMPTY);
    setTagDraft("");
    fetchBlogTaxonomy()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]));
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
          tag_titles: p.tag_titles ?? [],
          reading_minutes: p.reading_minutes ? String(p.reading_minutes) : "",
          cover_media_id: p.cover_media_id,
          meta_title: p.meta_title ?? "",
          meta_description: p.meta_description ?? "",
        });
      })
      .catch(() => setError("دریافت اطلاعات نوشته ناموفق بود."))
      .finally(() => setLoading(false));
  }, [open, postId]);

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
    setSaving(true);
    const minutes = Number(form.reading_minutes || "0");
    const payload: PostPayload = {
      title: form.title.trim(),
      slug: form.slug.trim() || form.title.trim(),
      excerpt: form.excerpt,
      body_html: form.body_html,
      cover_media_id: form.cover_media_id,
      category_id: form.category_id,
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
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیرهٔ نوشته ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border-variant px-5 py-3">
          <SheetTitle>{postId ? "ویرایش نوشته" : "نوشتهٔ تازه"}</SheetTitle>
          <SheetDescription>
            {postId
              ? "تغییرها را ذخیره کنید تا در وبلاگ اعمال شود."
              : "نوشته به‌صورت پیش‌نویس ساخته می‌شود؛ بعد از بازبینی آن را منتشر کنید."}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-label="در حال بارگذاری نوشته">
            <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-40 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <Tabs defaultValue="meta" className="min-h-0 flex-1 gap-0 overflow-hidden">
            <div className="border-b border-border-variant px-5">
              <TabsList variant="line" className="h-10 w-full justify-start gap-4 p-0">
                <TabsTrigger value="meta">اطلاعات</TabsTrigger>
                <TabsTrigger value="body">بدنه</TabsTrigger>
                <TabsTrigger value="media">رسانه و سئو</TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {error && (
                <div className="mb-4">
                  <Alert>{error}</Alert>
                </div>
              )}

              <TabsContent value="meta" className="space-y-4">
                <Field label="عنوان" htmlFor="p-title" required>
                  <Input id="p-title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="نامک" htmlFor="p-slug" hint="خالی بگذارید تا از عنوان ساخته شود.">
                    <Input id="p-slug" dir="ltr" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
                  </Field>
                  <Field label="دسته‌بندی" htmlFor="p-category">
                    <Select
                      id="p-category"
                      value={form.category_id ?? ""}
                      onChange={(e) => set("category_id", e.target.value || null)}
                    >
                      <option value="">— انتخاب نشده —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field
                  label="خلاصه"
                  htmlFor="p-excerpt"
                  hint="در فهرست وبلاگ و نتایج جست‌وجو نمایش داده می‌شود."
                >
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
                <Field
                  label="زمان تقریبی مطالعه (دقیقه)"
                  htmlFor="p-reading"
                  hint="خالی بگذارید تا از طول متن حساب شود."
                >
                  <Input
                    id="p-reading"
                    dir="ltr"
                    inputMode="numeric"
                    value={form.reading_minutes}
                    onChange={(e) => set("reading_minutes", e.target.value)}
                  />
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
                  minHeight="26rem"
                />
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <MediaSelect
                  id="p-cover"
                  label="تصویر کاور"
                  kind="image"
                  value={form.cover_media_id}
                  onChange={(v) => set("cover_media_id", v)}
                  hint="برای افزودن تصویر تازه به بخش «رسانه‌ها» بروید."
                />
                <Field label="عنوان سئو" htmlFor="p-meta-title" hint="خالی = عنوان نوشته.">
                  <Input
                    id="p-meta-title"
                    value={form.meta_title}
                    onChange={(e) => set("meta_title", e.target.value)}
                  />
                </Field>
                <Field
                  label="توضیح سئو"
                  htmlFor="p-meta-desc"
                  hint="خلاصه‌ای برای نتایج جست‌وجو؛ خالی = خلاصهٔ نوشته."
                >
                  <Textarea
                    id="p-meta-desc"
                    value={form.meta_description}
                    onChange={(e) => set("meta_description", e.target.value)}
                  />
                </Field>
              </TabsContent>
            </div>
          </Tabs>
        )}

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-border-variant px-5 py-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={() => void save()} loading={saving} disabled={!form.title.trim()}>
            {postId ? "ذخیرهٔ نوشته" : "ساخت نوشته"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
