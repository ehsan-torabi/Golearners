"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/card";
import { ApiError, formatTomanFromRial, type CourseSummary } from "@/lib/api";
import { adminCreateCourse, adminPublishCourse, fetchAdmin } from "@/lib/admin";
import { fa } from "@/lib/utils";

const STATUS_FA: Record<string, string> = {
  draft: "پیش‌نویس",
  published: "منتشرشده",
  archived: "بایگانی",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = React.useState<CourseSummary[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "", slug: "", summary: "", description_html: "", level: "beginner", price_toman: "",
  });

  const load = React.useCallback(async () => {
    setError("");
    try {
      const res = await fetchAdmin<{ data: CourseSummary[] }>("/courses?per_page=50");
      setCourses(res.data ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در دریافت فهرست");
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
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
      setForm({ title: "", slug: "", summary: "", description_html: "", level: "beginner", price_toman: "" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در ایجاد دوره");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(id: string, current: string) {
    setError("");
    try {
      await adminPublishCourse(id, current !== "published");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">مدیریت دوره‌ها</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "بستن" : "دوره جدید"}</Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

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
              <select
                id="a-level"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="h-11 w-full rounded-field border-line bg-field px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="beginner">مقدماتی</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">پیشرفته</option>
              </select>
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
              <Button type="submit" disabled={busy}>
                {busy ? "در حال ذخیره…" : "ایجاد دوره (پیش‌نویس)"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {courses.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">دوره‌ای ثبت نشده است.</Card>
        ) : (
          courses.map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <Link href={`/courses/${encodeURIComponent(c.slug)}`} className="font-medium hover:text-primary">
                  {c.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                  /courses/{c.slug}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">{c.price_rial === 0 ? "رایگان" : formatTomanFromRial(c.price_rial)}</span>
                <Badge
                  className={
                    c.status === "published"
                      ? "border-success/40 text-success"
                      : c.status === "draft"
                        ? "border-warning/40 text-warning"
                        : "border-border text-muted-foreground"
                  }
                >
                  {STATUS_FA[c.status] ?? c.status}
                </Badge>
                <Button
                  size="sm"
                  variant={c.status === "published" ? "secondary" : "primary"}
                  onClick={() => togglePublish(c.id, c.status)}
                >
                  {c.status === "published" ? "لغو انتشار" : "انتشار"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
