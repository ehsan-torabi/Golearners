"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { OtpField } from "@/components/ui/otp-field";
import { ApiError, api } from "@/lib/api";

type Step = "form" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("form");
  const [fullName, setFullName] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ full_name: fullName, mobile, password }),
      });
      setStep("verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در برقراری ارتباط");
    } finally {
      setBusy(false);
    }
  }

  async function verify(code: string) {
    setError("");
    setBusy(true);
    try {
      await api("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ mobile, code, purpose: "verify" }),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در برقراری ارتباط");
    } finally {
      setBusy(false);
    }
  }

  if (step === "verify") {
    return (
      <Card className="mx-auto max-w-sm p-8 text-center">
        <h1 className="font-display text-lg">تأیید شماره موبایل</h1>
        <p className="mt-2 text-sm text-muted-foreground">کد ۶ رقمی پیامک‌شده را وارد کنید.</p>
        <div className="mt-6 flex justify-center">
          <OtpField onComplete={verify} disabled={busy} />
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm p-8">
      <h1 className="text-center font-display text-lg">ساخت حساب کاربری</h1>
      <form onSubmit={register} className="mt-6 space-y-4">
        <Field label="نام و نام خانوادگی" htmlFor="full_name" required>
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Field>
        <Field label="شماره موبایل" htmlFor="mobile" required hint="برای ورود و اطلاع‌رسانی دوره‌ها استفاده می‌شود.">
          <Input
            id="mobile"
            name="mobile"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09xxxxxxxxx"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
          />
        </Field>
        <Field label="رمز عبور" htmlFor="password" required hint="حداقل ۸ کاراکتر شامل حرف و عدد.">
          <Input
            id="password"
            name="password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "لطفاً صبر کنید…" : "ثبت‌نام"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        حساب دارید؟{" "}
        <a href="/login" className="text-primary underline underline-offset-4">
          ورود
        </a>
      </p>
    </Card>
  );
}
