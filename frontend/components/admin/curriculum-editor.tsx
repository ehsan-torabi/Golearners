"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MediaField } from "@/components/admin/media-field";
import {
  adminCreateLesson,
  adminCreateSection,
  adminCurriculum,
  adminDeleteLesson,
  adminDeleteSection,
  adminReorderLessons,
  adminReorderSections,
  adminUpdateLesson,
  adminUpdateSection,
  type AdminLesson,
  type AdminSection,
  type LessonPayload,
} from "@/lib/admin";
import { fa } from "@/lib/utils";

const LESSON_STATUS_FA: Record<string, { label: string; tone: "success" | "warning" | "neutral" }> = {
  ready: { label: "آماده", tone: "success" },
  published: { label: "منتشرشده", tone: "success" },
  draft: { label: "پیش‌نویس", tone: "warning" },
};

function minutes(seconds: number): string {
  return fa(Math.round(seconds / 60));
}

/**
 * Section/lesson editor for a course curriculum.
 * Every mutation is audited server-side; the panel only reflects the API result.
 */
export function CurriculumEditor({ courseId }: { courseId: string }) {
  const [sections, setSections] = React.useState<AdminSection[]>([]);
  const [lessons, setLessons] = React.useState<AdminLesson[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const [newSection, setNewSection] = React.useState("");
  const [editingSection, setEditingSection] = React.useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = React.useState("");
  const [editingLesson, setEditingLesson] = React.useState<AdminLesson | null>(null);
  const [creatingIn, setCreatingIn] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError("");
    try {
      const res = await adminCurriculum(courseId);
      setSections(res.sections ?? []);
      setLessons(res.lessons ?? []);
    } catch {
      setError("دریافت سرفصل دوره ناموفق بود.");
    } finally {
      setLoaded(true);
    }
  }, [courseId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const lessonsOf = (sectionId: string) =>
    lessons
      .filter((l) => l.section_id === sectionId)
      .sort((a, b) => a.position - b.position);

  async function run(key: string, fn: () => Promise<unknown>) {
    setError("");
    setBusy(key);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "انجام عملیات ناموفق بود.");
    } finally {
      setBusy("");
    }
  }

  async function addSection() {
    const title = newSection.trim();
    if (!title) return;
    await run("section", () => adminCreateSection(courseId, { title, position: sections.length }));
    setNewSection("");
  }

  async function moveSection(index: number, delta: number) {
    const next = [...sections];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await run("sections", () => adminReorderSections(courseId, next.map((s) => s.id)));
  }

  async function moveLesson(sectionId: string, index: number, delta: number) {
    const list = lessonsOf(sectionId);
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    await run("lessons", () => adminReorderLessons(sectionId, list.map((l) => l.id)));
  }

  if (!loaded) {
    return (
      <div className="space-y-3" aria-label="در حال بارگذاری سرفصل">
        <div className="h-9 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap items-end gap-2">
        <Field label="بخش تازه" htmlFor="new-section" className="min-w-56 flex-1">
          <Input
            id="new-section"
            value={newSection}
            placeholder="مثلاً: آشنایی با ابزارها"
            onChange={(e) => setNewSection(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addSection();
              }
            }}
          />
        </Field>
        <Button onClick={() => void addSection()} loading={busy === "section"} disabled={!newSection.trim()}>
          افزودن بخش
        </Button>
      </div>

      {sections.length === 0 ? (
        <EmptyState
          title="سرفصلی ثبت نشده است"
          body="برای انتشار دوره دست‌کم یک بخش و یک درسِ آماده لازم است."
        />
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <section key={section.id} className="rounded-lg border border-border-variant bg-card">
              <header className="flex flex-wrap items-center gap-2 border-b border-border-variant px-3 py-2">
                {editingSection === section.id ? (
                  <Input
                    value={sectionTitle}
                    aria-label="عنوان بخش"
                    onChange={(e) => setSectionTitle(e.target.value)}
                    className="h-7 max-w-64"
                  />
                ) : (
                  <h3 className="text-sm font-medium">
                    {fa(index + 1)}. {section.title}
                  </h3>
                )}
                <Badge tone="neutral">{fa(lessonsOf(section.id).length)} درس</Badge>
                <div className="ms-auto flex items-center gap-1">
                  {editingSection === section.id ? (
                    <>
                      <Button
                        size="xs"
                        loading={busy === `section-${section.id}`}
                        onClick={() =>
                          void run(`section-${section.id}`, async () => {
                            await adminUpdateSection(section.id, {
                              title: sectionTitle.trim() || section.title,
                              position: section.position,
                            });
                            setEditingSection(null);
                          })
                        }
                      >
                        ذخیره
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => setEditingSection(null)}>
                        انصراف
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setEditingSection(section.id);
                          setSectionTitle(section.title);
                        }}
                      >
                        ویرایش عنوان
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={index === 0 || busy === "sections"}
                        onClick={() => void moveSection(index, -1)}
                      >
                        بالا
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={index === sections.length - 1 || busy === "sections"}
                        onClick={() => void moveSection(index, 1)}
                      >
                        پایین
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-destructive-text"
                        loading={busy === `section-${section.id}`}
                        onClick={() =>
                          void run(`section-${section.id}`, () => adminDeleteSection(section.id))
                        }
                      >
                        حذف
                      </Button>
                    </>
                  )}
                </div>
              </header>
              <LessonList
                section={section}
                lessons={lessonsOf(section.id)}
                busy={busy}
                creating={creatingIn === section.id}
                editingLesson={editingLesson}
                onCreate={() => setCreatingIn(section.id)}
                onCancelCreate={() => setCreatingIn(null)}
                onEdit={setEditingLesson}
                onMove={(i, d) => void moveLesson(section.id, i, d)}
                onDelete={(lesson) =>
                  void run(`lesson-${lesson.id}`, () => adminDeleteLesson(lesson.id))
                }
                onSaveLesson={(payload, id) =>
                  run(`lesson-${id}`, async () => {
                    if (id) {
                      await adminUpdateLesson(id, payload);
                    } else {
                      await adminCreateLesson(section.id, payload);
                    }
                    setEditingLesson(null);
                    setCreatingIn(null);
                  })
                }
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** Lessons of one section, with the create/edit form. */
function LessonList({
  section,
  lessons,
  busy,
  creating,
  editingLesson,
  onCreate,
  onCancelCreate,
  onEdit,
  onMove,
  onDelete,
  onSaveLesson,
}: {
  section: AdminSection;
  lessons: AdminLesson[];
  busy: string;
  creating: boolean;
  editingLesson: AdminLesson | null;
  onCreate: () => void;
  onCancelCreate: () => void;
  onEdit: (lesson: AdminLesson) => void;
  onMove: (index: number, delta: number) => void;
  onDelete: (lesson: AdminLesson) => void;
  onSaveLesson: (payload: LessonPayload, id: string | null) => void;
}) {
  return (
    <div className="space-y-2 p-3">
      {lessons.length === 0 && !creating ? (
        <p className="text-xs text-muted-foreground">این بخش هنوز درسی ندارد.</p>
      ) : (
        <ul className="space-y-2">
          {lessons.map((lesson, index) => {
            const status = LESSON_STATUS_FA[lesson.status] ?? {
              label: lesson.status,
              tone: "neutral" as const,
            };
            return (
              <li
                key={lesson.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border-variant px-3 py-2"
              >
                <span className="text-sm">{lesson.title}</span>
                {lesson.duration_seconds > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {minutes(lesson.duration_seconds)} دقیقه
                  </span>
                )}
                <Badge tone={status.tone}>{status.label}</Badge>
                {lesson.is_preview && <Badge tone="info">پیش‌نمایش</Badge>}
                <div className="ms-auto flex items-center gap-1">
                  <Button size="xs" variant="ghost" onClick={() => onEdit(lesson)}>
                    ویرایش
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    disabled={index === 0 || busy === "lessons"}
                    onClick={() => onMove(index, -1)}
                  >
                    بالا
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    disabled={index === lessons.length - 1 || busy === "lessons"}
                    onClick={() => onMove(index, 1)}
                  >
                    پایین
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-destructive-text"
                    loading={busy === `lesson-${lesson.id}`}
                    onClick={() => onDelete(lesson)}
                  >
                    حذف
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating && (
        <LessonForm
          busy={busy === "lesson-new"}
          onCancel={onCancelCreate}
          onSave={(payload) => onSaveLesson(payload, null)}
        />
      )}

      {editingLesson && editingLesson.section_id === section.id && (
        <LessonForm
          lesson={editingLesson}
          busy={busy === `lesson-${editingLesson.id}`}
          onCancel={() => onEdit(null as unknown as AdminLesson)}
          onSave={(payload) => onSaveLesson(payload, editingLesson.id)}
        />
      )}

      {!creating && !editingLesson && (
        <Button size="xs" variant="outline" onClick={onCreate}>
          افزودن درس
        </Button>
      )}
    </div>
  );
}

/** Create/edit form for one lesson. */
function LessonForm({
  lesson,
  busy,
  onCancel,
  onSave,
}: {
  lesson?: AdminLesson;
  busy: boolean;
  onCancel: () => void;
  onSave: (payload: LessonPayload) => void;
}) {
  const [title, setTitle] = React.useState(lesson?.title ?? "");
  const [duration, setDuration] = React.useState(
    lesson ? String(Math.round(lesson.duration_seconds / 60)) : "",
  );
  const [status, setStatus] = React.useState(lesson?.status ?? "draft");
  const [isPreview, setIsPreview] = React.useState(lesson?.is_preview ?? false);
  const [body, setBody] = React.useState(lesson?.content_html ?? "");
  const [mediaId, setMediaId] = React.useState<string | null>(lesson?.media_id ?? null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const minutes = Number(duration || "0");
    onSave({
      title: title.trim(),
      content_html: body,
      position: lesson?.position ?? 0,
      is_preview: isPreview,
      duration_seconds: Number.isFinite(minutes) ? Math.max(0, minutes) * 60 : 0,
      status,
      media_id: mediaId,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-md border border-border-variant bg-muted/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="عنوان درس" htmlFor="lesson-title" required>
          <Input id="lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="مدت (دقیقه)" htmlFor="lesson-duration">
          <Input
            id="lesson-duration"
            dir="ltr"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </Field>
        <Field label="وضعیت" htmlFor="lesson-status">
          <Select id="lesson-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">پیش‌نویس</option>
            <option value="ready">آماده</option>
            <option value="published">منتشرشده</option>
          </Select>
        </Field>
        <Field label="نمایش رایگان" htmlFor="lesson-preview">
          <div className="flex h-8 items-center gap-2">
            <Switch id="lesson-preview" checked={isPreview} onCheckedChange={setIsPreview} />
            <span className="text-xs text-muted-foreground">این درس پیش از خرید هم دیده می‌شود.</span>
          </div>
        </Field>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="lesson-body" className="block text-sm font-medium text-foreground">
          متن درس
        </label>
        <RichTextEditor
          id="lesson-body"
          value={body}
          onChange={({ html }) => setBody(html)}
          placeholder="توضیح کوتاه درس را بنویسید…"
          minHeight="10rem"
        />
      </div>

      <MediaField
        id="lesson-media"
        label="رسانهٔ درس"
        kind="video"
        value={mediaId}
        onChange={setMediaId}
        uploaderLabel="بارگذاری ویدیوی درس"
        hint="ویدیوی درس همین‌جا بارگذاری می‌شود؛ نیازی به بخش رسانه‌ها نیست."
      />

      <div className="flex items-center gap-2">
        <Button type="submit" loading={busy} disabled={!title.trim()}>
          {lesson ? "ذخیرهٔ درس" : "افزودن درس"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

