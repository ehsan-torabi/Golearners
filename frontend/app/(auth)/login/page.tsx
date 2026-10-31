"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { OtpField } from "@/components/ui/otp-field";
import { ApiError, api } from "@/lib/api";
import { fa } from "@/lib/utils";

type Mode = "password" | "otp";
type Step = "phone" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("password");
  const [step, setStep] = React.useState<Step>("phone");
  const [mobile, setMobile] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
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
      <Card className="mx-auto max-w-sm p-8 text-center">
        <Smartphone className="mx-auto size-8 text-primary" strokeWidth={1.5} aria-hidden />
        <h1 className="mt-3 font-display text-lg">کد تأیید را وارد کنید</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          کد ۶ رقمی به شماره <span dir="ltr">{fa(mobile)}</span> پیامک شد.
        </p>
        <div className="mt-6 flex justify-center">
          <OtpField onComplete={submitCode} disabled={busy} />
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <button
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
              setError("ارسال مجدد ممکن نشد؛ کمی بعد تلاش کنید.");
            }
          }}
        >
          {resent > 0 ? `ارسال مجدد تا ${fa(resent)} ثانیه دیگر` : "ارسال مجدد کد"}
        </button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm p-8">
      <h1 className="text-center font-display text-lg">ورود به گوLearn</h1>
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-control bg-muted p-1 text-sm" role="tablist">
        {(
          [
            ["password", "رمز عبور"],
            ["otp", "کد پیامکی"],
          ] as [Mode, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            className={`rounded-field px-3 py-2 transition-colors duration-(--motion) ease-motion ${
              mode === value ? "bg-card text-foreground shadow-control" : "text-muted-foreground"
            }`}
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
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {mode === "password" ? (
            <KeyRound className="size-4" strokeWidth={1.5} aria-hidden />
          ) : (
            <Smartphone className="size-4" strokeWidth={1.5} aria-hidden />
          )}
          {busy ? "لطفاً صبر کنید…" : mode === "password" ? "ورود" : "ارسال کد تأیید"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        حساب ندارید؟{" "}
        <a href="/register" className="text-primary underline underline-offset-4">
          ثبت‌نام
        </a>
      </p>
    </Card>
  );
}
