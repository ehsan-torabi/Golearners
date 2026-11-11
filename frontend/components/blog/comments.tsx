"use client";

import * as React from "react";
import { api } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

interface Comment {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
  replies: Comment[];
}

interface CommentsProps {
  postSlug: string;
}

/**
 * Guest comments, moderation-gated (like sisoog). Nothing renders until an
   admin approves it.
 */
export function BlogComments({ postSlug }: CommentsProps) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [posted, setPosted] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    author_name: "",
    email: "",
    body: "",
  });

  React.useEffect(() => {
    void load();
  }, [postSlug]);

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ data: Comment[] }>(
        `/blog/posts/${encodeURIComponent(postSlug)}/comments`,
      );
      setComments(res.data ?? []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api<{ queued: boolean }>(
        `/blog/posts/${encodeURIComponent(postSlug)}/comments`,
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      if (res.queued) {
        setPosted(true);
        setForm({ author_name: "", email: "", body: "" });
        setLoading(true);
        void load();
      }
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : "ارسال دیدگاه ناموفق بود.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="comments-title" className="mt-14 border-t border-line pt-8">
      <h2 id="comments-title" className="mb-5 font-semibold text-xl">
        دیدگاه‌ها
      </h2>
      {posted && (
        <div className="mb-4 rounded bg-primary-tint border border-primary/30 p-4 text-sm text-accent-strong">
          دیدگاه شما ثبت شد و بعد از بررسی مدیر منتشر می‌شود.
        </div>
      )}
      {loading ? (
        <div className="space-y-3">
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          title="هنوز دیدگاهی ثبت نشده است"
          body="نظرتان را بنویسید تا بعد از تایید منتشر شود."
        />
      ) : (
        <ul className="space-y-6">
          {comments.map((c) => (
            <li key={c.id} className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <span className="shrink-0 font-medium text-foreground">
                  {c.author_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatJalali(new Date(c.created_at))}
                </span>
              </div>
              <p className="text-sm leading-7 text-foreground whitespace-pre-line">
                {c.body}
              </p>
              {c.replies.length > 0 && (
                <ul className="ps-4 space-y-3 border-l border-border-variant pl-4">
                  {c.replies.map((r) => (
                    <li key={r.id} className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 font-medium text-foreground">
                          {r.author_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatJalali(new Date(r.created_at))}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-foreground whitespace-pre-line">
                        {r.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نام شما" htmlFor="author">
              <Input
                id="author"
                value={form.author_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, author_name: e.target.value }))
                }
                required
              />
            </Field>
            <Field label="ایمیل شما" htmlFor="email">
              <Input
                id="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                type="email"
                required
              />
            </Field>
          </div>
          <Field label="نظرتان" hint="بعد از تایید مدیر منتشر می‌شود." htmlFor="comment-body">
            <Textarea
              id="body"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              required
            />
          </Field>
          <Button type="submit" disabled={busy || posted}>
            {busy ? "ثبت..." : "ثبت نظر"}
          </Button>
          {error && <p className="text-xs text-destructive-text">{error}</p>}
        </form>
      </Card>
    </section>
  );
}

