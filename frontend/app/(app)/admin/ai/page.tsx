"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  api,
  formatTomanFromRial,
} from "@/lib/api";
import {
  adminAIDeleteDraft,
  adminAIApprove,
  adminAIDraft,
  adminAIDrafts,
  adminAIGenerate,
  adminAIReject,
  type AIDraft,
  type AIKind,
  type AIStatus,
} from "@/lib/admin";
import { KINDS, kindLabel } from "@/components/admin/ai-kinds";
import { DiffView } from "@/components/admin/ai-diff-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const STATUSES: { value: AIStatus; label: string }[] = [
  { value: "pending", label: "در انتظار تصمیم" },
  { value: "applied", label: "اعمال شده" },
  { value: "rejected", label: "رد شده" },
  { value: "ready", label: "گزارش (Read-only)" },
  { value: "failed", label: "اعمال نشد" },
];

export default function AssistantPage() {
  const [filterStatus, setFilterStatus] = React.useState<AIStatus | "">("");
  const [filterKind, setFilterKind] = React.useState<AIKind | "">("");
  const [view, setView] = React.useState<"worklist" | "new" | "diff">("worklist");
  const [drafts, setDrafts] = React.useState<AIDraft[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [error, setError] = React.useState("");
  const [openDraft, setOpenDraft] = React.useState<number | null>(null);
  const [instructions, setInstructions] = React.useState("");

  const fetchDrafts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminAIDrafts(filterStatus, filterKind, page);
      setDrafts(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "بارگذاری پیش‌نویس‌ها ناموفق بود",
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setPage(1);
    fetchDrafts();
  }, [filterStatus, filterKind]);

  async function generate(kind: AIKind) {
    setLoading(true);
    try {
      const draft = await adminAIGenerate({ kind, instructions });
      setLoading(false);
      setOpenDraft(draft.id);
      await fetchDrafts();
      setView("worklist");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ساخت پیش‌نویس با هوش مصنوعی ناموفق بود",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    setLoading(true);
    try {
      const res = await adminAIApprove(id);
      if (res.applied_at) {
        setError("");
      }
      await fetchDrafts();
      setView("worklist");
      setOpenDraft(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "تأیید پیش‌نویس ناموفق بود",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(id: number) {
    setLoading(true);
    try {
      await adminAIReject(id);
      await fetchDrafts();
      setView("worklist");
      setOpenDraft(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "رد پیش‌نویس ناموفق بود",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("این پیش‌نویس حذف شود؟")) return;
    try {
      await adminAIDeleteDraft(id);
      fetchDrafts();
    } catch {
      /* toast-less: error already surfaced by ApiError */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div>
          <h1 className="text-xl leading-7 text-foreground">دستیار هوشمند</h1>
          <p className="text-muted-foreground text-sm">
            پیشنهادهای هوش مصنوعی برای نوشته‌ها، دوره‌ها و سئو. هیچ چیزی قبل از تایید شما اعمال نمی‌شود.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {KINDS.map((k) => (
            <Button
              key={k}
              type="button"
              variant={view === "worklist" ? "default" : "outline"}
              onClick={() => generate(k as AIKind)}
              size="sm"
            >
              «{kindLabel(k as AIKind)}» جدید
            </Button>
          ))}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <Tabs value={view} onValueChange={(v) => setView(v as any)} className="gap-4 mt-4">
        <TabsList variant="line">
          <TabsTrigger value="worklist">پیش‌نویس‌ها</TabsTrigger>
          <TabsTrigger value="new">تولید جدید</TabsTrigger>
        </TabsList>

        <TabsContent value="worklist">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:items-stretch">
              <Field label="حالت">
                <Input list="ai-filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as AIStatus | "")} />
                <datalist id="ai-filter-status">
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                  <option value="">همه</option>
                </datalist>
              </Field>
              <Field label="نوع">
                <Input list="ai-filter-kind" value={filterKind} onChange={(e) => setFilterKind(e.target.value as AIKind | "")} />
                <datalist id="ai-filter-kind">
                  {KINDS.map((k) => (
                    <option key={k} value={k}>{kindLabel(k)}</option>
                  ))}
                  <option value="">همه</option>
                </datalist>
              </Field>
              <Button onClick={() => { setFilterStatus(""); setFilterKind(""); }}>بازنشانی</Button>
            </div>
            {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground">در حال بارگذاری…</div>}
            {drafts.length === 0 && !loading && (
              <div className="p-8 rounded bg-muted text-muted-foreground text-center">
                پیش‌نویس دستیاری ثبت نشده است.
              </div>
            )}
            <ScrollArea className="h-[56vh]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-muted-foreground border-b border-border">
                    <th className="pb-2" style={{ width: 200 }}>نوع</th>
                    <th className="pb-2">عنوان / هدف</th>
                    <th className="pb-2 text-sm w-20">تولید شده در</th>
                    <th className="pb-2 text-sm w-32">وضعیت</th>
                    <th className="pb-2 text-right w-48">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((d) => (
                    <tr key={d.id} className="border-b border-border/50">
                      <td className="py-2 font-medium text-sm">{kindLabel(d.kind)}</td>
                      <td className="py-2 text-sm truncate max-w-[220px]" title={d.target_label}>
                        {d.target_label || "-"}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground dir-ltr">
                        {new Date(d.created_at).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="py-2 text-xs">
                        <Badge
                          tone={
                            d.status === "applied"
                              ? "success"
                              : d.status === "rejected" || d.status === "failed"
                                ? "destructive"
                                : d.status === "ready"
                                  ? "info"
                                  : undefined
                          }
                          className="min-w-fit"
                        >
                          {STATUSES.find((s) => s.value === d.status)?.label ?? d.status}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex flex-col gap-1 text-right">
                          {d.status === "pending" && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  setOpenDraft(d.id);
                                  setView("diff");
                                }}
                                className="w-full text-xs py-1.5"
                              >
                                نمایش و تایید
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(d.id)}
                                className="w-full text-xs py-1.5 border-destructive/30"
                              >
                                رد
                              </Button>
                            </>
                          )}
                          {d.status === "failed" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(d.id)}
                              className="w-full text-xs py-1.5"
                            >
                              حذف
                            </Button>
                          )}
                          {d.status === "applied" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setOpenDraft(d.id)}
                              className="w-full text-xs py-1.5"
                            >
                              نمایش
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
            {total > drafts.length && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">
                  {total} Anzahl …
                </span>
                <Button size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}>
                  بیشتر
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="new">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              انتخاب نوع محتوای مورد نظر و نوشتن دستور؛ دستیار پیشنهادی را می‌سازد،
              سپس در پیش‌نویس‌ها نمایش داده می‌شود تا تایید یا رد کنید.
            </p>
            <Field label="دستور به دستیار" htmlFor="ai-instructions" hint="مثلاً «موضوع نوشته: شروع زبان گو؛ متن را روان‌تر بنویس»">
              <Textarea
                id="ai-instructions"
                className="min-h-24"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </Field>
            {KINDS.map((k) => (
              <Button
                key={k}
                type="button"
                onClick={() => generate(k as AIKind)}
                loading={loading}
                className="w-full lg:w-auto"
              >
                تولید «{kindLabel(k)}»
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="diff">
          {openDraft == null ? null : (
            <div className="space-y-3">
              <DiffView draftId={openDraft} onApprove={handleApprove} onReject={handleReject} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
