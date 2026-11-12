"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { adminAIApprove, adminAIReject, type AIDraft } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { kindLabel, statusLabel } from "./ai-kinds";

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Renders one proposal field with old → new side-by-side, changed cells tinted. */
function FieldDiff({ label, oldValue, newValue, kind }: { label: string; oldValue: string; newValue: string; kind: string }) {
  const changed = oldValue !== newValue;
  return (
    <div className="grid grid-cols-2 gap-3 mb-4 p-2 rounded border border-border/50">
      <div className="flex flex-col gap-1">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <div
          className={cn(
            "break-words text-sm whitespace-pre-wrap font-mono leading-6",
            changed ? "bg-yellow/5 border-l-2 border-warning/50" : "bg-muted/50 text-muted-foreground border-transparent",
          )}
          dangerouslySetInnerHTML={{ __html: changed ? `<mark class="bg-warning/40 text-warning-text">${escapeHtml(newValue || "—")}</mark>` : escapeHtml(newValue || "—") }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs font-medium text-muted-foreground">قبلاً</Label>
        <div
          className="break-words text-sm whitespace-pre-wrap font-mono leading-6 text-muted-foreground bg-muted/50"
          dangerouslySetInnerHTML={{ __html: escapeHtml(oldValue || "—") }}
        />
      </div>
    </div>
  );
}

export function DiffView({ draftId, onApprove, onReject }: { draftId: number; onApprove: (id: number) => void; onReject: (id: number) => void }) {
  const [draft, setDraft] = React.useState<AIDraft | null>(null);
  const [deciding, setDeciding] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        setDraft(await import("@/lib/admin").then((m) => m.adminAIDraft(draftId)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "بارگذاری پیش‌نویس ناموفق بود");
      }
    })();
  }, [draftId]);

  if (!draft) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">در حال بارگذاری پیش‌نویس…</div>;
  }
  if (error) return <Alert>{error}</Alert>;

  let oldText = "";
  let newText = "";
  let fields: { label: string; oldValue: string; newValue: string }[] = [];

  try {
    const orig = draft.original ? JSON.parse(draft.original as unknown as string) : {};
    const prop = draft.proposed ?? {};
    const keys = new Set([...Object.keys(orig as Record<string, unknown>), ...Object.keys(prop as Record<string, unknown>)]);
    for (const key of keys) {
      const o = String((orig as Record<string, unknown>)[key] ?? "");
      const n = String((prop as Record<string, unknown>)[key] ?? "");
      fields.push({ label: key, oldValue: o, newValue: n });
    }
    // guard against non-string payloads that JS's String() can't summarize
    if (fields.some((f) => f.newValue === "[object Object]" || f.oldValue === "[object Object]")) {
      oldText = JSON.stringify(orig, null, 2);
      newText = JSON.stringify(prop, null, 2);
    }
    oldText = JSON.stringify(orig, null, 2);
    newText = JSON.stringify(prop, null, 2);
  } catch {
    /* fall back to raw */
  }

  return (
    <div className="space-y-4 max-w-[900px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{kindLabel(draft.kind)}</Badge>
            <Badge tone={draft.status === "failed" ? "destructive" : undefined} variant="outline">
              {statusLabel(draft.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{draft.summary}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.notes && (
            <div className="rounded bg-muted/50 p-3 text-sm text-foreground/90 break-words">
              {draft.notes}
            </div>
          )}
          <Separator />
          {fields.length > 0 ? (
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 p-2 rounded border border-border/50">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-muted-foreground">{f.label}</Label>
                    <div
                      className={cn(
                        "break-words text-sm whitespace-pre-wrap font-mono leading-6 text-muted-foreground",
                        f.oldValue !== f.newValue
                          ? "bg-yellow/5 border-l-2 border-warning/50"
                          : "bg-transparent",
                      )}
                      dangerouslySetInnerHTML={{ __html: `<mark class="bg-warning/40 text-warning-text">${escapeHtml(f.newValue || "—")}</mark>` }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-medium text-muted-foreground">قبلاً</Label>
                    <div className="break-words text-sm whitespace-pre-wrap font-mono leading-6 text-muted-foreground bg-muted/50" dangerouslySetInnerHTML={{ __html: escapeHtml(f.oldValue || "—") }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded bg-muted/50 p-3 text-sm text-muted-foreground text-center">فیلد تغییری برای نمایش ثبت نشده است.</div>
          )}
          {draft.error && (
            <Alert>{`خطای اعمال: ${draft.error}`}</Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {draft.provider} · {draft.model} · ورودی {draft.prompt_tokens} توکن · خروجی {draft.completion_tokens} توکن
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDeciding(true);
              try { onReject(draft.id); } finally { setDeciding(false); }
            }}
            disabled={draft.status !== "pending"}
          >
            رد پیش‌نویس
          </Button>
          <Button
            type="button"
            onClick={() => {
              setDeciding(true);
              try { onApprove(draft.id); } finally { setDeciding(false); }
            }}
            disabled={draft.status !== "pending" || deciding}
            loading={deciding}
          >
            تایید و اعمال
          </Button>
        </div>
      </div>
    </div>
  );
}
