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
import { cn, fa } from "@/lib/utils";

type Mode = "password" | "otp";
type Step = "phone" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("password");
  const [step, setStep] = React.useState<Step>("phone");
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [resent, setResent] = React.useState(0);

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "otp") {
        await api("/auth/otp/request", {
          method: "POST",
          body: JSON.stringify({ mobile, purpose: "login" }),
        });
        setStep("code");
      } else {
        await api("/auth/login", { method: "POST", body: JSON.stringify({ mobile, password }) });
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در برقراری ارتباط");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(code: string) {
    setError("");
    setBusy(true);
    try {
      await api("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ mobile, code, purpose: "login" }),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در برقراری ارتباط");
    } finally {
      setBusy(false);
    }
  }

  if (step === "code") {
    return (
      <Card className="reveal mx-auto max-w-sm p-8 text-center">
        <h1 className="font-display text-2xl">کد تأیید را وارد کن</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          کد ۶ رقمی به شماره <span dir="ltr">{fa(mobile)}</span> پیامک شد.
        </p>
        <div className="mt-6 flex justify-center">
          <OtpField onComplete={submitCode} disabled={busy} />
        </div>
        {error && <Alert className="mt-4">{error}</Alert>}
        <button
          type="button"
          className="mt-5 text-xs text-muted-foreground underline underline-offset-4 disabled:opacity-50"
          disabled={resent > 0}
          onClick={async () => {
            try {
              await api("/auth/otp/request", { method: "POST", body: JSON.stringify({ mobile, purpose: "login" }) });
              setResent(60);
              const t = setInterval(() => {
                setResent((s) => {
                  if (s <= 1) clearInterval(t);
                  return s - 1;
                });
              }, 1000);
            } catch {
              setError("ارسال مجدد ممکن نشد؛ کمی بعد تلاش کن.");
            }
          }}
        >
          {resent > 0 ? `ارسال مجدد تا ${fa(resent)} ثانیه دیگر` : "ارسال مجدد کد"}
        </button>
      </Card>
    );
  }

  return (
    <Card className="reveal mx-auto max-w-sm p-8">
      <h1 className="text-center font-display text-2xl">ورود به گوLearn</h1>
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-control bg-muted p-1 text-sm">
        {(
          [
            ["password", "رمز عبور"],
            ["otp", "کد پیامکی"],
          ] as [Mode, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            className={cn(
              "rounded-field px-3 py-2 transition-colors duration-(--motion) ease-motion",
              mode === value ? "bg-card text-foreground shadow-raise" : "text-muted-foreground",
            )}
            onClick={() => {
              setMode(value);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submitPhone} className="mt-6 space-y-4">
        <Field label="شماره موبایل" htmlFor="mobile" required>
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
        {mode === "password" && (
          <Field label="رمز عبور" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
        )}
        {error && <Alert>{error}</Alert>}
        <Button type="submit" className="w-full" loading={busy}>
          {mode === "password" ? "ورود" : "ارسال کد تأیید"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        حساب نداری؟{" "}
        <Link href="/register" className="text-accent-strong underline underline-offset-4">
          ثبت‌نام
        </Link>
      </p>
    </Card>
  );
}
