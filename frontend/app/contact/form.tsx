"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api";

export function ContactForm() {
  const [name, setName] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [body, setBody] = React.useState("");
  const [website, setWebsite] = React.useState(""); // honeypot
  const [error, setError] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/contact", {
        method: "POST",
        body: JSON.stringify({ name, contact, body, website }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خطا در برقراری ارتباط");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-success" role="status">
        پیام شما ثبت شد؛ در اولین فرصت پاسخ می‌دهیم.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <Field label="نام" htmlFor="c-name" required>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </Field>
      <Field label="موبایل یا ایمیل" htmlFor="c-contact" required>
        <Input id="c-contact" dir="ltr" value={contact} onChange={(e) => setContact(e.target.value)} required />
      </Field>
      <Field label="پیام" htmlFor="c-body" required>
        <Textarea id="c-body" value={body} onChange={(e) => setBody(e.target.value)} required minLength={10} />
      </Field>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "در حال ارسال…" : "ارسال پیام"}
      </Button>
    </form>
  );
}
