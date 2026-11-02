"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { VideoPlayer } from "@/components/ui/video-player";
import { fa } from "@/lib/utils";

export interface PreviewLessonData {
  id: string;
  title: string;
  duration_seconds: number;
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return fa(`${m}:${String(s).padStart(2, "0")}`);
}

/**
 * Free-preview row of the syllabus: looks like the static lesson row, but the
 * whole row is a toggle — clicking it fetches a signed URL (the playback
 * endpoint allows anonymous previews) and expands the vibefarsi player
 * inline, the way «پیش‌نمایش رایگان» works on reference course pages.
 */
export function PreviewLessonItem({ lesson }: { lesson: PreviewLessonData }) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [state, setState] = React.useState<"idle" | "loading" | "error">("idle");

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (url) return;
    setState("loading");
    try {
      const res = await fetch(`/api/v1/playback/lessons/${lesson.id}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { playback_url: string };
      setUrl(body.playback_url);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <li className="border-b border-border-variant last:border-b-0">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors duration-(--motion) ease-motion hover:bg-muted/60 md:px-5"
      >
        <span
          aria-hidden
          className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-success-bg"
        >
          <Play className="size-2.5 translate-x-px fill-success-text text-success-text" />
        </span>
        <span className="min-w-0 flex-1 truncate text-foreground/90">{lesson.title}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatClock(lesson.duration_seconds)}
        </span>
        <span className="hidden w-28 shrink-0 text-end text-xs font-medium text-success-text sm:block">
          {open ? "بستن پیش‌نمایش" : "پیش‌نمایش رایگان"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 md:px-5">
          {state === "loading" && (
            <p className="rounded-field bg-muted/60 p-4 text-xs text-muted-foreground">
              در حال آماده‌سازی پخش…
            </p>
          )}
          {state === "error" && (
            <p className="rounded-field bg-destructive/10 p-4 text-xs leading-6 text-destructive-text">
              پخش پیش‌نمایش در دسترس نیست؛ دوباره تلاش کن.
            </p>
          )}
          {state === "idle" && url && (
            <VideoPlayer src={url} title={`پیش‌نمایش ${lesson.title}`} className="aspect-video w-full" />
          )}
        </div>
      )}
    </li>
  );
}
