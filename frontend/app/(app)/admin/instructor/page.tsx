"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MediaField } from "@/components/admin/media-field";
import {
  ApiError,
  fetchInstructorProfile,
  updateInstructorProfile,
  type InstructorProfile,
} from "@/lib/admin";

const SOCIALS: { key: string; label: string; placeholder: string; ltr: boolean }[] = [
  { key: "github", label: "گیت‌هاب", placeholder: "https://github.com/username", ltr: true },
  { key: "linkedin", label: "لینکدین", placeholder: "https://linkedin.com/in/username", ltr: true },
  { key: "website", label: "وب‌سایت", placeholder: "https://example.com", ltr: true },
  { key: "email", label: "ایمیل", placeholder: "hi@example.com", ltr: true },
];

/** about-the-teacher management: the /instructor public page renders exactly
    these fields, so nothing on the site is unmanaged anymore. */
export default function AdminInstructorPage() {
  const [form, setForm] = React.useState<InstructorProfile>({
    headline: "",
    bio_html: "",
    avatar_media_id: null,
    socials: {},
  });
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setError("");
    fetchInstructorProfile()
      .then((p) =>
        setForm({
          headline: p.headline ?? "",
          bio_html: p.bio_html ?? "",
          avatar_media_id: p.avatar_media_id ?? null,
          socials: p.socials ?? {},
        }),
      )
      .catch(() => setError("دریافت پروفایل مدرس ناموفق بود."))
      .finally(() => setLoaded(true));
  }, []);

  async function save() {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await updateInstructorProfile(form);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیرهٔ پروفایل ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="space-y-3" aria-label="در حال بارگذاری پروفایل مدرس">
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-64 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="reveal text-xl leading-7 text-foreground">پروفایل مدرس</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            این اطلاعات در صفحهٔ «درباره مدرس» سایت نمایش داده می‌شود.
          </p>
        </div>
        {saved && <Badge tone="success">ذخیره شد</Badge>}
      </header>

      {error && <Alert>{error}</Alert>}

      <Card className="space-y-5 p-6">
        <Field label="تیتر" htmlFor="ins-headline" hint="یک جملهٔ معرفی، بالای بیوگرافی.">
          <Input
            id="ins-headline"
            value={form.headline}
            maxLength={200}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
            placeholder="مثلاً: مهندس نرم‌افزار و مدرس بک‌اند"
          />
        </Field>

        <div>
          <label htmlFor="ins-bio" className="mb-1.5 block text-sm font-medium">
            بیوگرافی
          </label>
          <RichTextEditor
            id="ins-bio"
            value={form.bio_html}
            onChange={({ html }) => setForm((f) => ({ ...f, bio_html: html }))}
            placeholder="مسیر حرفه‌ای، تخصص‌ها و تجربه‌های تدریس…"
            variant="simple"
            minHeight="14rem"
          />
        </div>

        <MediaField
          id="ins-avatar"
          label="تصویر مدرس"
          kind="image"
          value={form.avatar_media_id}
          onChange={(v) => setForm((f) => ({ ...f, avatar_media_id: v }))}
          uploaderLabel="بارگذاری تصویر مدرس"
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">شبکه‌ها و تماس</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIALS.map((s) => (
              <Field key={s.key} label={s.label} htmlFor={`ins-${s.key}`}>
                <Input
                  id={`ins-${s.key}`}
                  dir={s.ltr ? "ltr" : undefined}
                  placeholder={s.placeholder}
                  value={form.socials?.[s.key] ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, socials: { ...f.socials, [s.key]: e.target.value } }))
                  }
                />
              </Field>
            ))}
          </div>
        </fieldset>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end border-t border-border-variant bg-background/95 py-3 backdrop-blur">
        <Button onClick={() => void save()} loading={saving}>
          ذخیرهٔ پروفایل
        </Button>
      </div>
    </div>
  );
}
