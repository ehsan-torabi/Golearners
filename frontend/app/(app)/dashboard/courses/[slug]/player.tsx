"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { VideoPlayer as VibefarsiPlayer } from "@/components/ui/video-player";
import { Skeleton } from "@/components/ui/section-head";

/**
 * Lesson player on the vibefarsi VideoPlayer: a signed URL per lesson,
 * resume from the server-side position, progress saved while watching
 * (every 10s of progress, once on unmount, and completed on end).
 * The local VOD adapter issues MP4 URLs; HLS (Arvan) will need player-level
 * support when that provider lands.
 *
 * Watch time is measured here as wall clock while the media actually plays,
 * and reported to the server every 15 seconds. The server clamps the
 * reported delta, so a scrubbed or paused player cannot inflate it.
 */
export function VideoPlayer({
  lessonId,
  title,
  startAt = 0,
}: {
  lessonId: string;
  title?: string;
  startAt?: number;
}) {
  const router = useRouter();
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [url, setUrl] = React.useState("");
  const [mediaError, setMediaError] = React.useState("");
  const lastSent = React.useRef(0);
  const lastTime = React.useRef(startAt);
  const playing = React.useRef(false);
  const lastTick = React.useRef(0);
  const watched = React.useRef(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState("loading");
        const { api } = await import("@/lib/api");
        const res = await api<{ playback_url: string }>(`/playback/lessons/${lessonId}`, {
          cache: "no-store",
        });
        if (cancelled) return;
        setUrl(res.playback_url);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const save = React.useCallback(
    async (completed?: boolean, position?: number) => {
      try {
        const { api } = await import("@/lib/api");
        await api(`/me/progress/${lessonId}`, {
          method: "PUT",
          body: JSON.stringify({
            position_seconds: Math.floor(position ?? lastTime.current),
            completed,
          }),
        });
      } catch {
        // offline progress save is best-effort
      }
    },
    [lessonId],
  );

  /** Sends the watch time gathered so far and resets the counter. */
  const flushWatch = React.useCallback(() => {
    const chunk = Math.round(watched.current);
    watched.current = 0;
    if (chunk <= 0) return;
    void import("@/lib/api")
      .then(({ reportWatch }) => reportWatch(lessonId, chunk))
      .catch(() => {
        // watch time is best-effort: a dropped beat is not worth an error
      });
  }, [lessonId]);

  // final flush when the lesson is switched or the page is left
  React.useEffect(() => {
    if (state !== "ready") return;
    return () => {
      void save(false, lastTime.current);
      flushWatch();
    };
  }, [lessonId, state, save, flushWatch]);

  if (state === "error") {
    return (
      <div
        role="alert"
        className="rounded-surface border border-destructive/30 bg-destructive/10 p-6 text-sm leading-7 text-destructive"
      >
        پخش در دسترس نیست؛ احتمالاً نشست منقضی شده. صفحه را تازه‌سازی کن یا دوباره وارد شو.
      </div>
    );
  }

  /* the file itself is missing or undecodable: say so instead of showing a
     broken player (the browser error would surface as a raw console event) */
  if (mediaError) {
    return (
      <div
        role="alert"
        className="rounded-surface border border-destructive/30 bg-destructive/10 p-6 text-sm leading-7 text-destructive"
      >
        {mediaError} اگر مدرس این درس را تازه کرده باشد، کمی بعد دوباره تلاش کن.
      </div>
    );
  }

  if (state !== "ready") {
    return (
      <div className="overflow-hidden rounded-surface border border-line bg-black">
        <Skeleton className="aspect-video w-full rounded-none" aria-label="در حال بارگذاری ویدیو" />
      </div>
    );
  }

  return (
    <VibefarsiPlayer
      src={url}
      title={title}
      startAt={startAt}
      className="overflow-hidden rounded-surface border border-line bg-black"
      onTimeUpdate={(seconds) => {
        lastTime.current = seconds;
        if (seconds - lastSent.current >= 10) {
          lastSent.current = seconds;
          void save(false, seconds);
        }
        // watch time counts the wall clock while the media runs and the tab
        // is visible; the per-tick cap keeps a throttled background tab
        // from crediting minutes it was never watched
        const now = Date.now();
        const visible = document.visibilityState === "visible";
        const delta =
          playing.current && visible ? Math.min((now - lastTick.current) / 1000, 1.5) : 0;
        lastTick.current = now;
        watched.current += delta;
        if (watched.current >= 15) {
          flushWatch();
        }
      }}
      onPlayingChange={(isPlaying) => {
        playing.current = isPlaying;
        lastTick.current = Date.now();
      }}
      onEnded={() => {
        lastSent.current = Number.MAX_SAFE_INTEGER;
        void save(true).then(() => router.refresh());
      }}
      onError={(reason) => setMediaError(reason)}
    />
  );
}
