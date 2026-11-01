"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { OtpField } from "@/components/ui/otp-field";
import { Alert } from "@/components/ui/alert";
import { ApiError, api } from "@/lib/api";
import { fa } from "@/lib/utils";

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
      <Card className="reveal mx-auto max-w-sm p-8 text-center">
        <h1 className="font-semibold text-2xl">تأیید شماره موبایل</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          کد ۶ رقمی به شماره <span dir="ltr">{fa(mobile)}</span> پیامک شد.
        </p>
        <div className="mt-6 flex justify-center">
          <OtpField onComplete={verify} disabled={busy} />
        </div>
        {error && <Alert className="mt-4">{error}</Alert>}
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-3 text-xs text-muted-foreground">
            در حالت توسعه کد پیامک در لاگ سرور چاپ می‌شود.
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="reveal mx-auto max-w-sm p-8">
      <h1 className="text-center font-semibold text-2xl">ساخت حساب کاربری</h1>
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
        {error && <Alert>{error}</Alert>}
        <Button type="submit" className="w-full" loading={busy}>
          ثبت‌نام
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        حساب داری؟{" "}
        <Link href="/login" className="text-accent-strong underline underline-offset-4">
          ورود
        </Link>
      </p>
    </Card>
  );
}
