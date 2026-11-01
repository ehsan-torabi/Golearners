"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/section-head";

// Dynamically-typed import keeps hls.js out of SSR bundles.
export function VideoPlayer({ lessonId }: { lessonId: string }) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [error, setError] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    let hls: { destroy: () => void } | null = null;

    (async () => {
      try {
        setLoading(true);
        const { api } = await import("@/lib/api");
        const res = await api<{ playback_url: string }>(`/playback/lessons/${lessonId}`, {
          cache: "no-store",
        });
        if (cancelled) return;
        setUrl(res.playback_url);
        const video = ref.current;
        if (!video) return;

        if (res.playback_url.includes(".m3u8") && !video.canPlayType("application/vnd.apple.mpegurl")) {
          const mod = await import("hls.js");
          if (cancelled) return;
          const hlsInstance = new mod.default({ maxBufferLength: 30 });
          hls = hlsInstance;
          hlsInstance.loadSource(res.playback_url);
          hlsInstance.attachMedia(video);
        } else {
          video.src = res.playback_url;
        }
      } catch {
        if (!cancelled) {
          setError("پخش در دسترس نیست؛ احتمالاً نشست منقضی شده. صفحه را تازه‌سازی کن یا دوباره وارد شو.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [lessonId]);

  // progress persistence: every 10s + on pause
  React.useEffect(() => {
    const video = ref.current;
    if (!video || !url) return;
    let lastSent = 0;

    const save = async (completed?: boolean) => {
      try {
        const { api } = await import("@/lib/api");
        await api(`/me/progress/${lessonId}`, {
          method: "PUT",
          body: JSON.stringify({ position_seconds: Math.floor(video.currentTime), completed }),
        });
      } catch {
        // offline progress save is best-effort
      }
    };
    const timer = setInterval(() => {
      if (video.currentTime - lastSent >= 10) {
        lastSent = video.currentTime;
        void save();
      }
    }, 5000);
    const onPause = () => void save();
    video.addEventListener("pause", onPause);
    return () => {
      clearInterval(timer);
      video.removeEventListener("pause", onPause);
    };
  }, [lessonId, url]);

  if (error) {
    return (
      <div role="alert" className="rounded-surface border border-destructive/30 bg-destructive/10 p-6 text-sm leading-7 text-destructive">
        {error}
      </div>
    );
  }

  /* the <video> stays mounted (hls.js attaches to it); the skeleton overlays while loading */
  return (
    <div className="relative overflow-hidden rounded-surface border border-line bg-black">
      {loading && (
        <Skeleton className="absolute inset-0 z-10 rounded-none" aria-label="در حال بارگذاری ویدیو" />
      )}
      <video
        ref={ref}
        controls
        controlsList="nodownload"
        disablePictureInPicture
        className="aspect-video w-full"
        playsInline
      />
    </div>
  );
}
