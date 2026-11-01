"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ApiError, formatTomanFromRial, type CourseSummary } from "@/lib/api";
import { adminCreateCourse, adminPublishCourse, fetchAdmin } from "@/lib/admin";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, string> = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  archived: "بایگانی",
};

const EMPTY_FORM = {
  title: "", slug: "", summary: "", description_html: "", level: "beginner", price_toman: "",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = React.useState<CourseSummary[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState("");
  const [toggling, setToggling] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const res = await fetchAdmin<{ data: CourseSummary[] }>("/admin/courses?per_page=50");
      setCourses(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت فهرست");
    } finally {
      setLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adminCreateCourse({
        title: form.title,
        slug: form.slug || form.title,
        summary: form.summary,
        description_html: form.description_html,
        level: form.level,
        price_rial: Number(form.price_toman || "0") * 10,
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در ایجاد دوره");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(id: string, current: string) {
    setError("");
    setToggling(id);
    try {
      await adminPublishCourse(id, current !== "published");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    } finally {
      setToggling("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">مدیریت دوره‌ها</h1>
        <Button variant={showForm ? "outline" : "primary"} onClick={() => setShowForm((s) => !s)}>
          {showForm ? "بستن فرم" : "دوره جدید"}
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {showForm && (
        <Card className="p-6">
          <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="عنوان" htmlFor="a-title" required className="sm:col-span-2">
              <Input id="a-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Field>
            <Field label="نامک (خالی = خودکار)" htmlFor="a-slug">
              <Input id="a-slug" dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <Field label="قیمت (تومان)" htmlFor="a-price">
              <Input
                id="a-price"
                dir="ltr"
                inputMode="numeric"
                value={form.price_toman}
                onChange={(e) => setForm({ ...form, price_toman: e.target.value })}
              />
            </Field>
            <Field label="سطح" htmlFor="a-level">
              <Select id="a-level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option value="beginner">مقدماتی</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">پیشرفته</option>
              </Select>
            </Field>
            <Field label="خلاصه" htmlFor="a-summary" className="sm:col-span-2">
              <Input id="a-summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </Field>
            <Field label="توضیحات (HTML)" htmlFor="a-desc" className="sm:col-span-2">
              <Textarea
                id="a-desc"
                dir="ltr"
                className="font-mono text-xs"
                value={form.description_html}
                onChange={(e) => setForm({ ...form, description_html: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>
                ایجاد دوره (پیش‌نویس)
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!loaded ? (
        <Card className="space-y-3 p-6" aria-label="در حال بارگذاری فهرست دوره‌ها">
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        </Card>
      ) : courses.length === 0 ? (
        <EmptyState
          title="دوره‌ای ثبت نشده است"
          body="اولین دوره را با دکمهٔ «دوره جدید» بساز."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{fa(courses.length)} دوره</p>
          {courses.map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <Link
                  href={`/courses/${encodeURIComponent(c.slug)}`}
                  className="font-medium transition-colors duration-(--motion) ease-motion hover:text-accent-strong"
                >
                  {c.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                  /courses/{c.slug}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">{c.price_rial === 0 ? "رایگان" : formatTomanFromRial(c.price_rial)}</span>
                <Badge tone={c.status === "published" ? "success" : c.status === "draft" ? "warning" : "neutral"}>
                  {STATUS_FA[c.status] ?? c.status}
                </Badge>
                <Button
                  size="sm"
                  variant={c.status === "published" ? "outline" : "primary"}
                  loading={toggling === c.id}
                  onClick={() => togglePublish(c.id, c.status)}
                >
                  {c.status === "published" ? "لغو انتشار" : "انتشار"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
