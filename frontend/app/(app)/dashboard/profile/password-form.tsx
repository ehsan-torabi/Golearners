"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { ApiError, api } from "@/lib/api";

/* real endpoint: POST /auth/password/change (session required) */
export function PasswordChangeForm() {
  const router = useRouter();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/auth/password/change", {
        method: "POST",
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      setDone(true);
      setCurrent("");
      setNext("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تغییر رمز عبور ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    /* the backend revokes every session on a password change, so the user
       has to sign in again with the new password */
    return (
      <div className="space-y-3">
        <Alert tone="success">
          رمز عبور با موفقیت تغییر کرد. برای ادامه، دوباره وارد شو.
        </Alert>
        <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
          رفتن به صفحهٔ ورود
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-sm space-y-4">
      <Field label="رمز عبور فعلی" htmlFor="pw-current" required>
        <Input
          id="pw-current"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </Field>
      <Field label="رمز عبور تازه" htmlFor="pw-next" required hint="حداقل ۸ کاراکتر شامل حرف و عدد.">
        <Input
          id="pw-next"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
        />
      </Field>
      {error && <Alert>{error}</Alert>}
      <Button type="submit" loading={busy}>
        ذخیره رمز تازه
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        با تغییر رمز، همهٔ نشست‌های باز بسته می‌شوند و باید دوباره وارد شوی.
      </p>
    </form>
  );
}
