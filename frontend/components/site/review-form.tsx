"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { ApiError, api } from "@/lib/api";

const RATING_FA: Record<number, string> = {
  1: "خیلی ضعیف",
  2: "ضعیف",
  3: "متوسط",
  4: "خوب",
  5: "عالی",
};

/** Star picker + comment for entitled learners; moderated after submit. */
export function ReviewForm({ slug }: { slug: string }) {
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState("");
  const [error, setError] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone("");
    if (rating < 1 || rating > 5) {
      setError("یک امتیاز انتخاب کن.");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ message: string }>(`/courses/${encodeURIComponent(slug)}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, body: body.trim() }),
      });
      setDone(res.message || "نظرت ثبت شد و پس از تأیید نمایش داده می‌شود.");
      setBody("");
      setRating(0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ثبت نظر ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border-variant p-4">
      <fieldset>
        <legend className="text-sm font-medium text-foreground">امتیاز تو</legend>
        <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="امتیاز دوره">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} از ۵: ${RATING_FA[value]}`}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(value)}
              className="cursor-pointer p-0.5 text-2xl leading-none text-warning transition-colors duration-100"
            >
              <span aria-hidden className={(hover || rating) >= value ? "" : "opacity-30"}>
                ★
              </span>
            </button>
          ))}
          <span className="ms-2 text-xs text-muted-foreground" aria-live="polite">
            {RATING_FA[hover || rating] ?? ""}
          </span>
        </div>
      </fieldset>

      <Field label="نظرت دربارهٔ دوره" htmlFor="review-body" hint="پس از تأیید مدرس منتشر می‌شود.">
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-24"
          placeholder="چه چیزهایی یاد گرفتی؟ به چه کسی پیشنهادش می‌کنی؟"
        />
      </Field>

      {error && <Alert>{error}</Alert>}
      {done && <p className="text-sm text-success-text">{done}</p>}

      <Button type="submit" loading={busy}>
        ثبت نظر
      </Button>
    </form>
  );
}
