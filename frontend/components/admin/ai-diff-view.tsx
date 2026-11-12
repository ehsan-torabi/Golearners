"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { adminAIDraft, type AIDraft } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { kindLabel, statusLabel } from "./ai-kinds";

/** The same body treatment the public blog page gives article HTML. */
const PROSE =
  "prose-fa min-w-0 text-[0.95rem] leading-9 [&_a]:text-accent-strong [&_a]:underline [&_h2]:mt-8 [&_h2]:font-semibold [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-lg [&_li]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-3 [&_table]:my-4 [&_table]:w-full [&_table]:text-sm [&_th]:border [&_th]:border-line [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_ul]:list-disc [&_ul]:ps-6";

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Persian digits + thousands separators for numbers pulled from the API. */
function prettyValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return String(v);
    return v.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
  }
  if (typeof v === "boolean") return v ? "بله" : "خیر";
  if (Array.isArray(v)) return v.length ? `${v.length} مورد` : "—";
  return String(v);
}

/** Field labels for the diff rows; unknown keys fall back to the raw key. */
const FIELD_LABELS: Record<string, string> = {
  title: "عنوان",
  slug: "اسلاگ",
  excerpt: "خلاصه",
  body_html: "بدنه",
  meta_title: "عنوان متا",
  meta_description: "توضیح متا",
  tag_titles: "برچسب‌ها",
  summary: "خلاصهٔ کوتاه",
  description_html: "توضیحات کامل",
  outcomes: "نتایج یادگیری",
};

function fieldLabel(key: string) {
  return FIELD_LABELS[key] ?? key;
}

function isPlainString(v: unknown): v is string {
  return typeof v === "string";
}

/** Renders any JSON payload as readable sections: arrays of objects become
 *  tables (the stats case), everything else becomes labeled rows. */
function DataPanel({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <p className="text-sm text-muted-foreground">داده‌ای ثبت نشده است.</p>;
  }
  if (isPlainString(data)) {
    return <p className="text-sm whitespace-pre-wrap break-words">{data}</p>;
  }
  const obj = data as Record<string, unknown>;
  const sections: [string, unknown][] = Object.entries(obj);
  return (
    <div className="space-y-5">
      {sections.map(([key, value]) => (
        <div key={key}>
          <Label className="text-sm font-semibold text-foreground mb-1.5 block">{key}</Label>
          {Array.isArray(value) && value.length > 0 && typeof value[0] === "object" ? (
            <div className="overflow-x-auto rounded-field border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {Object.keys(value[0] as Record<string, unknown>).map((h) => (
                      <th key={h} className="border-b border-line bg-muted px-3 py-2 text-start font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {value.map((row, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      {Object.values(row as Record<string, unknown>).map((cell, j) => (
                        <td key={j} className="px-3 py-2">
                          {prettyValue(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : Array.isArray(value) ? (
            <ul className="list-disc ps-6 text-sm leading-7">
              {value.length === 0 ? (
                <li className="text-muted-foreground">—</li>
              ) : (
                value.map((item, i) => <li key={i}>{prettyValue(item)}</li>)
              )}
            </ul>
          ) : isPlainString(value) ? (
            <p className="text-sm leading-7">{value}</p>
          ) : value && typeof value === "object" ? (
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <div key={k} className="rounded-field border border-line bg-muted/40 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium">{prettyValue(v)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm">{prettyValue(value)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/** True for the read-only report kinds that render analysis + source data
 *  instead of a field diff. */
function isReport(kind: string) {
  return kind === "stats_report" || kind === "freeform";
}

export function AIDraftDetail({
  draft,
  onBack,
  onApprove,
  onReject,
}: {
  draft: AIDraft;
  onBack: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}) {
  const report = isReport(draft.kind);
  const proposed = draft.proposed ?? {};
  const original = draft.original as Record<string, unknown> | null | undefined;

  return (
    <div className="space-y-4 max-w-[900px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{kindLabel(draft.kind)}</Badge>
            <Badge
              tone={
                draft.status === "applied"
                  ? "success"
                  : draft.status === "rejected" || draft.status === "failed"
                    ? "destructive"
                    : draft.status === "ready"
                      ? "info"
                      : undefined
              }
              className="min-w-fit"
            >
              {statusLabel(draft.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">{draft.summary}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            بازگشت
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.notes && (
            <div className="rounded-field bg-muted/50 p-3 text-sm leading-7 text-foreground/90 break-words">
              {draft.notes}
            </div>
          )}
          {draft.error && <Alert>{`خطای اعمال: ${draft.error}`}</Alert>}
          <Separator />

          {report ? (
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block text-sm font-semibold">تحلیل دستیار</Label>
                <div
                  className={cn(PROSE, "rounded-field border border-line p-4")}
                  dangerouslySetInnerHTML={{ __html: String(proposed.html ?? "") }}
                />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-semibold">داده‌های بررسی‌شده</Label>
                <DataPanel data={original} />
              </div>
            </div>
          ) : (
            <FieldTable draft={draft} proposed={proposed} original={original} />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground" dir="ltr">
          {draft.provider} · {draft.model} · {draft.prompt_tokens} توکن ورودی · {draft.completion_tokens} توکن خروجی
        </div>
        {draft.status === "pending" && onApprove && onReject && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onReject(draft.id)}>
              رد پیش‌نویس
            </Button>
            <Button type="button" onClick={() => onApprove(draft.id)}>
              تایید و اعمال
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Side-by-side before/after rows for the content kinds. */
function FieldTable({
  draft,
  proposed,
  original,
}: {
  draft: AIDraft;
  proposed: Record<string, unknown>;
  original: Record<string, unknown> | null | undefined;
}) {
  const cur = original ?? {};
  const changed = Object.keys(proposed).filter((k) => {
    const before = JSON.stringify(cur[k] ?? null);
    const after = JSON.stringify(proposed[k]);
    return before !== after;
  });
  const untouched = Object.keys(cur).filter((k) => !changed.includes(k) && !(k in proposed));

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {changed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            این پیش‌نویس فیلد قابل‌مقایسه‌ای ندارد.
          </p>
        ) : (
          changed.map((key) => {
            const beforeVal = String(cur[key] ?? "—");
            const afterVal = String(proposed[key] ?? "—");
            const long = beforeVal.length > 120 || afterVal.length > 120;
            const isHtml = /[<][a-z]+[>]/i.test(beforeVal) || /[<][a-z]+[>]/i.test(afterVal);
            return (
              <div key={key} className="rounded-field border border-line overflow-hidden">
                <Label className="block bg-muted px-3 py-2 text-sm font-medium">
                  {fieldLabel(key)}
                </Label>
                <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
                  <div className="bg-background px-3 py-2">
                    <span className="mb-1 block text-xs text-muted-foreground">فعلی</span>
                    {isHtml ? (
                      <div className={cn("text-sm leading-7", long && "max-h-40 overflow-y-auto")} dangerouslySetInnerHTML={{ __html: beforeVal }} />
                    ) : (
                      <div className={cn("text-sm break-words whitespace-pre-wrap", long && "max-h-40 overflow-y-auto")}>
                        {beforeVal}
                      </div>
                    )}
                  </div>
                  <div className="bg-background px-3 py-2">
                    <span className="mb-1 block text-xs font-medium text-success-text">پیشنهاد</span>
                    {isHtml ? (
                      <div className={cn("text-sm leading-7", long && "max-h-40 overflow-y-auto")} dangerouslySetInnerHTML={{ __html: afterVal }} />
                    ) : (
                      <div className={cn("text-sm break-words whitespace-pre-wrap", long && "max-h-40 overflow-y-auto")}>
                        {afterVal}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {untouched.length > 0 && (
        <div>
          <Label className="mb-2 block text-sm text-muted-foreground">بدون تغییر</Label>
          <div className="flex flex-wrap gap-1.5">
            {untouched.map((k) => (
              <Badge key={k} variant="outline">
                {fieldLabel(k)}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        {draft.action === "create" ? "ایجاد یک ردیف تازه" : "ویرایش ردیف موجود"}
      </div>
    </div>
  );
}

/** Fetches the draft by id and renders the detail card. */
export function AIDraftCard({
  draftId,
  onBack,
  onApprove,
  onReject,
}: {
  draftId: number;
  onBack: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}) {
  const [draft, setDraft] = React.useState<AIDraft | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminAIDraft(draftId);
        if (alive) setDraft(res);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "بارگذاری پیش‌نویس ناموفق بود.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [draftId]);

  if (error) {
    return (
      <div className="space-y-3">
        <Alert>{error}</Alert>
        <Button type="button" variant="outline" onClick={onBack}>
          بازگشت
        </Button>
      </div>
    );
  }
  if (!draft) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">در حال بارگذاری پیش‌نویس…</div>;
  }
  return <AIDraftDetail draft={draft} onBack={onBack} onApprove={onApprove} onReject={onReject} />;
}

/** Kept for the hub page: same component under the previous export name. */
export { AIDraftCard as DiffView };
