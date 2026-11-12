"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  ApiError,
  adminAIModels,
  adminAISettings,
  adminAITestConnection,
  adminSaveAISettings,
  type AISettings,
} from "@/lib/admin";

const PROVIDERS: { value: string; label: string }[] = [
  { value: "openai", label: "سازگار با OpenAI (OpenAI، OpenRouter، Ollama و …)" },
  { value: "anthropic", label: "Anthropic (کلود)" },
  { value: "gemini", label: "گوگل جمینای" },
  { value: "mock", label: "آزمایشی — بدون سرویس بیرونی" },
];

/** The «دستیار هوشمند» tab of the admin settings page. */
export function AISettingsCard() {
  const [settings, setSettings] = React.useState<AISettings | null>(null);
  const [apiKey, setApiKey] = React.useState("");
  const [models, setModels] = React.useState<string[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ ok: boolean; text: string } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [s, m] = await Promise.all([
          adminAISettings(),
          adminAIModels().catch(() => [] as string[]),
        ]);
        setSettings(s);
        setModels(m);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "خطا در دریافت تنظیمات دستیار");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  function patch<K extends keyof AISettings>(key: K, value: AISettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const next = await adminSaveAISettings({
        enabled: settings.enabled,
        provider: settings.provider,
        base_url: settings.base_url,
        api_key: apiKey,
        model: settings.model,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        persona: settings.persona,
      });
      setSettings(next);
      setApiKey("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ذخیرهٔ تنظیمات دستیار ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await adminAITestConnection();
      setTestResult({
        ok: res.ok,
        text: res.ok
          ? `اتصال برقرار شد (${res.provider} · ${res.model} · ${res.latency_ms} میلی‌ثانیه)`
          : `اتصال ناموفق: ${res.error ?? "خطای نامشخص"}`,
      });
    } catch (err) {
      setTestResult({ ok: false, text: err instanceof ApiError ? err.message : "تست اتصال ناموفق بود" });
    } finally {
      setTesting(false);
    }
  }

  if (!loaded) {
    return (
      <Card className="space-y-3 p-6" aria-label="در حال بارگذاری تنظیمات دستیار">
        <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
      </Card>
    );
  }
  if (!settings) {
    return <Alert>{error || "تنظیمات دستیار در دسترس نیست."}</Alert>;
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>دستیار هوشمند</CardTitle>
          <CardDescription>
            پیشنهاد نوشته، محتوای دوره و سئو با هوش مصنوعی؛ هر پیشنهاد پیش از اعمال باید توسط شما تأیید شود.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert>{error}</Alert>}
          {saved && <Alert tone="success">تنظیمات دستیار ذخیره شد.</Alert>}
          {testResult && (
            <Alert tone={testResult.ok ? "success" : undefined}>{testResult.text}</Alert>
          )}

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="ai-enabled" className="text-sm font-medium">
              فعال بودن دستیار
            </Label>
            <Switch
              id="ai-enabled"
              checked={settings.enabled}
              onCheckedChange={(v: boolean) => patch("enabled", v)}
            />
          </div>

          <Field label="سرویس‌دهنده" htmlFor="ai-provider">
            <Select
              id="ai-provider"
              value={settings.provider}
              onChange={(e) => {
                patch("provider", e.target.value);
                setTestResult(null);
              }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>

          {settings.provider === "openai" && (
            <Field
              label="آدرس پایه (Base URL)"
              htmlFor="ai-base-url"
              hint="برای OpenAI خالی بگذارید؛ برای سرویس‌های سازگار مثل OpenRouter یا Ollama آدرس را وارد کنید."
            >
              <Input
                id="ai-base-url"
                dir="ltr"
                placeholder="https://api.openai.com/v1"
                value={settings.base_url}
                onChange={(e) => patch("base_url", e.target.value)}
              />
            </Field>
          )}

          {settings.provider !== "mock" && (
            <Field
              label="کلید API"
              htmlFor="ai-key"
              hint={
                settings.api_key_set
                  ? `کلید ذخیره شده است (پایان: ${settings.api_key_last4}). برای تغییر، کلید تازه را وارد کنید.`
                  : "کلید نزد سرویس‌دهندهٔ خود را وارد کنید؛ پس از ذخیره فقط پایان کلید نمایش داده می‌شود."
              }
            >
              <Input
                id="ai-key"
                type="password"
                dir="ltr"
                autoComplete="off"
                placeholder={settings.api_key_set ? "••••••••" : "sk-…"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </Field>
          )}

          <Field label="مدل" htmlFor="ai-model">
            <Input
              id="ai-model"
              dir="ltr"
              list="ai-model-options"
              value={settings.model}
              onChange={(e) => patch("model", e.target.value)}
            />
            <datalist id="ai-model-options">
              {models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="خلاقیت (temperature)" htmlFor="ai-temp" hint="۰ دقیق، ۱ خلاق">
              <Input
                id="ai-temp"
                dir="ltr"
                type="number"
                min={0}
                max={1.5}
                step={0.1}
                value={settings.temperature}
                onChange={(e) => patch("temperature", Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="سقف توکن پاسخ" htmlFor="ai-max-tokens">
              <Input
                id="ai-max-tokens"
                dir="ltr"
                type="number"
                min={100}
                max={16000}
                step={100}
                value={settings.max_tokens}
                onChange={(e) => patch("max_tokens", Number(e.target.value) || 0)}
              />
            </Field>
          </div>

          <Field
            label="دستورهای شخصی‌سازی"
            htmlFor="ai-persona"
            hint="مثلاً لحن خاص برند یا مخاطب هدف؛ هر پیشنهاد با این دستورها نوشته می‌شود."
          >
            <Textarea
              id="ai-persona"
              className="min-h-24"
              value={settings.persona}
              onChange={(e) => patch("persona", e.target.value)}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" loading={saving}>
              ذخیره تنظیمات دستیار
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={testing}
              aria-label="تست اتصال به سرویس‌دهنده"
            >
              {testing ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-4" /> در حال تست…
                </span>
              ) : (
                "تست اتصال"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
