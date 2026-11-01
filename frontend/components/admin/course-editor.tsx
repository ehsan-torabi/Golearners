"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import { CurriculumEditor } from "@/components/admin/curriculum-editor";
import { MediaSelect } from "@/components/admin/media-select";
import {
  adminCreateCourse,
  adminGetCourse,
  adminUpdateCourse,
  fetchCourseCategories,
  type CoursePayload,
  type TaxonomyItem,
} from "@/lib/admin";

interface CourseForm {
  title: string;
  slug: string;
  summary: string;
  level: string;
  price: string;
  compare_at: string;
  is_featured: boolean;
  category_ids: string[];
  description_html: string;
  prerequisites_html: string;
  outcomes: string[];
  cover_media_id: string | null;
  promo_video_media_id: string | null;
  meta_title: string;
  meta_description: string;
}

const EMPTY: CourseForm = {
  title: "",
  slug: "",
  summary: "",
  level: "beginner",
  price: "",
  compare_at: "",
  is_featured: false,
  category_ids: [],
  description_html: "",
  prerequisites_html: "",
  outcomes: [],
  cover_media_id: null,
  promo_video_media_id: null,
  meta_title: "",
  meta_description: "",
};

/**
 * Course create/edit panel.
 * Ant v6 console density: one primary action in the footer, everything else
 * is a default or ghost control.
 */
export function CourseEditor({
  open,
  onOpenChange,
  courseId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | null;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<CourseForm>(EMPTY);
  const [categories, setCategories] = React.useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const set = <K extends keyof CourseForm>(key: K, value: CourseForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  React.useEffect(() => {
    if (!open) return;
    setError("");
    setForm(EMPTY);
    fetchCourseCategories()
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
    if (!courseId) return;
    setLoading(true);
    adminGetCourse(courseId)
      .then((res) => {
        const c = res.data;
        setForm({
          title: c.title,
          slug: c.slug,
          summary: c.summary,
          level: c.level,
          price: c.price_rial ? String(Math.round(c.price_rial / 10)) : "",
          compare_at: c.compare_at_price_rial ? String(Math.round(c.compare_at_price_rial / 10)) : "",
          is_featured: c.is_featured,
          category_ids: c.category_ids ?? [],
          description_html: c.description_html,
          prerequisites_html: c.prerequisites_html,
          outcomes: c.outcomes ?? [],
          cover_media_id: c.cover_media_id,
          promo_video_media_id: c.promo_video_media_id,
          meta_title: c.meta_title ?? "",
          meta_description: c.meta_description ?? "",
        });
      })
      .catch(() => setError("دریافت اطلاعات دوره ناموفق بود."))
      .finally(() => setLoading(false));
  }, [open, courseId]);

  async function save() {
    setError("");
    setSaving(true);
    const payload: CoursePayload = {
      title: form.title.trim(),
      slug: form.slug.trim() || form.title.trim(),
      summary: form.summary,
      description_html: form.description_html,
      level: form.level,
      price_rial: Math.max(0, Math.round(Number(form.price || "0"))) * 10,
      compare_at_price_rial: form.compare_at
        ? Math.max(0, Math.round(Number(form.compare_at))) * 10
        : null,
      prerequisites_html: form.prerequisites_html,
      outcomes: form.outcomes.map((o) => o.trim()).filter(Boolean),
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      cover_media_id: form.cover_media_id,
      promo_video_media_id: form.promo_video_media_id,
      is_featured: form.is_featured,
      category_ids: form.category_ids,
    };
    try {
      if (courseId) {
        await adminUpdateCourse(courseId, payload);
      } else {
        await adminCreateCourse(payload);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیرهٔ دوره ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border-variant px-5 py-3">
          <SheetTitle>{courseId ? "ویرایش دوره" : "دورهٔ تازه"}</SheetTitle>
          <SheetDescription>
            {courseId
              ? "تغییرها را ذخیره کنید تا در سایت اعمال شود."
              : "دوره به‌صورت پیش‌نویس ساخته می‌شود؛ پس از آماده‌سازی سرفصل آن را منتشر کنید."}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-label="در حال بارگذاری دوره">
            <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <Tabs defaultValue="basics" className="min-h-0 flex-1 gap-0 overflow-hidden">
            <div className="border-b border-border-variant px-5">
              <TabsList variant="line" className="h-10 w-full justify-start gap-4 p-0">
                <TabsTrigger value="basics">اطلاعات</TabsTrigger>
                <TabsTrigger value="content">محتوا</TabsTrigger>
                {courseId && <TabsTrigger value="curriculum">سرفصل</TabsTrigger>}
                <TabsTrigger value="media">رسانه و سئو</TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {error && (
                <div className="mb-4">
                  <Alert>{error}</Alert>
                </div>
              )}

              <TabsContent value="basics" className="space-y-4">
                <Field label="عنوان دوره" htmlFor="c-title" required>
                  <Input id="c-title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="نامک"
                    htmlFor="c-slug"
                    hint="خالی بگذارید تا از عنوان ساخته شود."
                  >
                    <Input id="c-slug" dir="ltr" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
                  </Field>
                  <Field label="سطح" htmlFor="c-level">
                    <Select id="c-level" value={form.level} onChange={(e) => set("level", e.target.value)}>
                      <option value="beginner">مقدماتی</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">پیشرفته</option>
                    </Select>
                  </Field>
                  <Field label="قیمت (تومان)" htmlFor="c-price" hint="صفر یعنی رایگان.">
                    <Input
                      id="c-price"
                      dir="ltr"
                      inputMode="numeric"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                    />
                  </Field>
                  <Field
                    label="قیمت پیش از تخفیف (تومان)"
                    htmlFor="c-compare"
                    hint="برای نمایش تخفیف؛ اختیاری."
                  >
                    <Input
                      id="c-compare"
                      dir="ltr"
                      inputMode="numeric"
                      value={form.compare_at}
                      onChange={(e) => set("compare_at", e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="خلاصه" htmlFor="c-summary" hint="در فهرست دوره‌ها و کارت‌ها نمایش داده می‌شود.">
                  <Textarea id="c-summary" value={form.summary} onChange={(e) => set("summary", e.target.value)} />
                </Field>
                <fieldset className="rounded-md border border-border-variant p-3">
                  <legend className="px-1 text-sm font-medium">دسته‌بندی</legend>
                  {categories.length === 0 ? (
                    <p className="text-xs text-muted-foreground">دسته‌بندی‌ای ثبت نشده است.</p>
                  ) : (
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {categories.map((c) => (
                        <label key={c.id} htmlFor={`cat-${c.id}`} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id={`cat-${c.id}`}
                            checked={form.category_ids.includes(c.id)}
                            onCheckedChange={(checked) =>
                              set(
                                "category_ids",
                                checked
                                  ? [...form.category_ids, c.id]
                                  : form.category_ids.filter((id) => id !== c.id),
                              )
                            }
                          />
                          {c.title}
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>
                <div className="flex items-center gap-2">
                  <Switch
                    id="c-featured"
                    checked={form.is_featured}
                    onCheckedChange={(v) => set("is_featured", v)}
                  />
                  <label htmlFor="c-featured" className="text-sm">
                    دورهٔ ویژه
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="c-desc" className="block text-sm font-medium text-foreground">
                    توضیح دوره
                  </label>
                  <RichTextEditor
                    id="c-desc"
                    value={form.description_html}
                    onChange={({ html }) => set("description_html", html)}
                    placeholder="این دوره چه چیزی آموزش می‌دهد؟"
                    minHeight="18rem"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="c-prereq" className="block text-sm font-medium text-foreground">
                    پیش‌نیازها
                  </label>
                  <RichTextEditor
                    id="c-prereq"
                    value={form.prerequisites_html}
                    onChange={({ html }) => set("prerequisites_html", html)}
                    placeholder="دانستنی‌های لازم پیش از شروع"
                    minHeight="10rem"
                  />
                </div>

                <fieldset className="rounded-md border border-border-variant p-3">
                  <legend className="px-1 text-sm font-medium">نتایج یادگیری</legend>
                  <div className="space-y-2">
                    {form.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={outcome}
                          aria-label={`نتیجهٔ یادگیری ${index + 1}`}
                          onChange={(e) =>
                            set(
                              "outcomes",
                              form.outcomes.map((o, i) => (i === index ? e.target.value : o)),
                            )
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive-text"
                          onClick={() =>
                            set("outcomes", form.outcomes.filter((_, i) => i !== index))
                          }
                        >
                          حذف
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => set("outcomes", [...form.outcomes, ""])}
                    >
                      افزودن نتیجه
                    </Button>
                  </div>
                </fieldset>
              </TabsContent>

              {courseId && (
                <TabsContent value="curriculum">
                  <CurriculumEditor courseId={courseId} />
                </TabsContent>
              )}

              <TabsContent value="media" className="space-y-4">
                <MediaSelect
                  id="c-cover"
                  label="تصویر کاور"
                  kind="image"
                  value={form.cover_media_id}
                  onChange={(v) => set("cover_media_id", v)}
                  hint="برای افزودن تصویر تازه به بخش «رسانه‌ها» بروید."
                />
                <MediaSelect
                  id="c-promo"
                  label="ویدیوی معرفی"
                  kind="video"
                  value={form.promo_video_media_id}
                  onChange={(v) => set("promo_video_media_id", v)}
                />
                <Field label="عنوان سئو" htmlFor="c-meta-title" hint="خالی = عنوان دوره.">
                  <Input
                    id="c-meta-title"
                    value={form.meta_title}
                    onChange={(e) => set("meta_title", e.target.value)}
                  />
                </Field>
                <Field
                  label="توضیح سئو"
                  htmlFor="c-meta-desc"
                  hint="خلاصه‌ای برای نتایج جست‌وجو؛ خالی = خلاصهٔ دوره."
                >
                  <Textarea
                    id="c-meta-desc"
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
            {courseId ? "ذخیرهٔ دوره" : "ساخت دوره"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
