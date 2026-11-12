"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, api } from "@/lib/api";
import { fetchAdmin } from "@/lib/admin";
import { AISettingsCard } from "@/components/admin/ai-settings";

interface Settings {
  site?: { title?: string; description?: string; maintenance_mode?: boolean };
  seo?: {
    meta_title?: string;
    meta_description?: string;
    og_image?: string | null;
    socials?: Record<string, string>;
  };
  gateways?: { default?: string; enabled?: string[] };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [tab, setTab] = React.useState("site" as "site" | "seo" | "gateways" | "ai");
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetchAdmin<Settings>("/admin/settings");
        setSettings(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "خطا در دریافت تنظیمات");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  function patch(path: string[], value: unknown) {
    setSettings((prev) => {
      const next: Settings = structuredClone(prev ?? {});
      let cursor = next as Record<string, unknown>;
      for (const key of path.slice(0, -1)) {
        const child = (cursor[key] as Record<string, unknown>) ?? {};
        cursor[key] = child;
        cursor = child;
      }
      cursor[path[path.length - 1]] = value;
      return next;
    });
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await api("/admin/settings", { method: "PATCH", body: JSON.stringify(settings ?? {}) });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیرهٔ تنظیمات ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <Card className="space-y-3 p-6" aria-label="در حال بارگذاری تنظیمات">
        <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  const tabs = [
    { value: "site", label: "سایت" },
    { value: "seo", label: "سئو" },
    { value: "gateways", label: "درگاه‌های پرداخت" },
    { value: "ai", label: "دستیار هوشمند" },
  ] as const;

  return (
    <>
      <h1 className="reveal text-xl leading-7 text-foreground">تنظیمات</h1>
      {error && <Alert>{error}</Alert>}
      {saved && <Alert tone="success">تنظیمات ذخیره شد.</Alert>}
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList variant="line">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="site" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سایت</CardTitle>
              <CardDescription>نام و توضیح سایت که در مرورگر و اشتراک‌گذاری دیده می‌شود.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="نام سایت" htmlFor="s-title">
                <Input
                  id="s-title"
                  value={settings?.site?.title ?? ""}
                  onChange={(e) => patch(["site", "title"], e.target.value)}
                />
              </Field>
              <Field label="توضیح سایت" htmlFor="s-desc">
                <Input
                  id="s-desc"
                  value={settings?.site?.description ?? ""}
                  onChange={(e) => patch(["site", "description"], e.target.value)}
                />
              </Field>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="s-maint" className="text-sm font-medium">
                  حالت تعمیرات
                </Label>
                <Switch
                  id="s-maint"
                  checked={Boolean(settings?.site?.maintenance_mode)}
                  onCheckedChange={(v: boolean) => patch(["site", "maintenance_mode"], v)}
                />
              </div>
            </CardContent>
          </Card>
          <Button type="button" onClick={() => save()} loading={saving}>
            ذخیره تنظیمات
          </Button>
        </TabsContent>
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>سئو</CardTitle>
              <CardDescription>عنوان و توضیح پیش‌فرض برای موتورهای جست‌وجو.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="عنوان متا" htmlFor="s-meta-title">
                <Input
                  id="s-meta-title"
                  value={settings?.seo?.meta_title ?? ""}
                  onChange={(e) => patch(["seo", "meta_title"], e.target.value)}
                />
              </Field>
              <Field label="توضیح متا" htmlFor="s-meta-desc">
                <Textarea
                  id="s-meta-desc"
                  className="min-h-20"
                  value={settings?.seo?.meta_description ?? ""}
                  onChange={(e) => patch(["seo", "meta_description"], e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>
          <Button type="button" onClick={() => save()} loading={saving}>
            ذخیره تنظیمات
          </Button>
        </TabsContent>
        <TabsContent value="gateways">
          <Card>
            <CardHeader>
              <CardTitle>درگاه‌های پرداخت</CardTitle>
              <CardDescription>
                درگاه فعال: <span dir="ltr">{settings?.gateways?.default ?? "ثبت نشده"}</span> · فعال‌ها:{" "}
                <span dir="ltr">{(settings?.gateways?.enabled ?? []).join(", ") || "ثبت نشده"}</span>
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="ai">
          <AISettingsCard />
        </TabsContent>
      </Tabs>
    </>
  );
}
