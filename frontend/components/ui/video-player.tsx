"use client";

import * as React from "react";
import { I18nProvider } from "@videojs/react";
import { HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { NeutralVideoSkin, Video, VideoPlayer as VjsPlayer } from "@videojs/react/video";
import "@videojs/react/i18n/locales/fa/register";
import "@videojs/react/video/neutral-skin.css";
import { cn, fa } from "@/lib/utils";

export interface VideoChapter {
  /** Start time in seconds. */
  start: number;
  title: string;
}

export interface VideoCaption {
  src: string;
  label: string;
  srclang: string;
  default?: boolean;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  /** Accessible name of the player region (the title sits next to it on the page). */
  title?: string;
  chapters?: VideoChapter[];
  /** WebVTT subtitle tracks (زیرنویس). */
  captions?: VideoCaption[];
  /** Render the clickable chapter list under the video. */
  showChapters?: boolean;
  /** Seconds to start from, e.g. where the student left off. */
  startAt?: number;
  onTimeUpdate?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
  /** fires when the browser cannot decode the source (missing or broken file) */
  onError?: (message: string) => void;
  className?: string;
}

/** ۶۵ → «۱:۰۵»، ۳۷۲۰ → «۱:۰۲:۰۰». */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return fa(h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`);
}

/**
 * پخش‌کننده‌ی ویدئوی آموزشی روی Video.js 10: پوسته‌ی خنثی با رنگ برند و
 * برچسب‌های فارسی، فصل‌ها زیر ویدئو، و پشتیبانی از MP4 و HLS.
 *
 * تایم‌لاین و کنترل‌ها در چیدمان راست‌به‌چپ مثل ویدئوهای دیگر می‌مانند، ولی
 * مقیاس زمان از چپ به راست است: پیشرفت رسانه به جهت متن وابسته نیست.
 */
export function VideoPlayer({
  src,
  poster,
  title,
  chapters = [],
  captions = [],
  showChapters = true,
  startAt = 0,
  onTimeUpdate,
  onEnded,
  onError,
  className,
}: VideoPlayerProps) {
  const video = React.useRef<HTMLVideoElement>(null);
  const [time, setTime] = React.useState(startAt);

  const sorted = React.useMemo(
    () => [...chapters].sort((a, b) => a.start - b.start),
    [chapters],
  );
  const chapterIndex = sorted.reduce(
    (acc, c, i) => (time >= c.start ? i : acc),
    -1,
  );

  // the browser can know the duration before React attaches the handler
  React.useEffect(() => {
    const v = video.current;
    if (v && v.readyState >= 1 && startAt > 0 && v.currentTime < 0.1) {
      v.currentTime = startAt;
    }
  }, [src, startAt]);

  const seek = (t: number) => {
    const v = video.current;
    if (!v) return;
    const end = Number.isFinite(v.duration) ? v.duration : 0;
    v.currentTime = Math.min(Math.max(0, t), end);
    setTime(v.currentTime);
    void v.play().catch(() => {});
  };

  const handleLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (startAt > 0 && v.currentTime < 0.1) v.currentTime = startAt;
    setTime(v.currentTime);
  };

  const handleTime = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setTime(v.currentTime);
    onTimeUpdate?.(v.currentTime, v.duration);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const code = e.currentTarget.error?.code;
    const reason =
      code === MediaError.MEDIA_ERR_NETWORK
        ? "دانلود ویدیو کامل نشد؛ اتصال را بررسی کنید."
        : code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "این ویدیو روی مرورگر شما پخش نمی‌شود."
          : "پخش این ویدیو ممکن نشد.";
    onError?.(reason);
  };

  const mediaProps = {
    ref: video,
    src,
    playsInline: true,
    preload: "metadata" as const,
    onLoadedMetadata: handleLoaded,
    onTimeUpdate: handleTime,
    onEnded: () => onEnded?.(),
    onError: handleError,
  };

  const media = /\.m3u8(\?|#|$)/i.test(src) ? (
    <HlsJsVideo {...mediaProps} />
  ) : (
    <Video {...mediaProps}>
      {captions.map((c) => (
        <track
          key={c.srclang}
          kind="subtitles"
          src={c.src}
          srcLang={c.srclang}
          label={c.label}
          default={c.default}
        />
      ))}
    </Video>
  );

  return (
    <div
      role="region"
      aria-label={title}
      className={cn("media-player space-y-3", className)}
    >
      <I18nProvider locale="fa">
        {/* the skin's own title overlay stays off: every page shows the
            lesson/course title right next to the player */}
        <VjsPlayer poster={poster ?? null}>
          <NeutralVideoSkin
            className="media-player__skin"
            style={{ width: "100%", aspectRatio: "16 / 9" }}
          >
            {media}
          </NeutralVideoSkin>
        </VjsPlayer>
      </I18nProvider>

      {showChapters && sorted.length > 0 && (
        <ol
          aria-label="فصل‌های ویدئو"
          className="divide-y divide-border overflow-hidden rounded-surface border border-border bg-card"
        >
          {sorted.map((c, i) => (
            <li key={c.start}>
              <button
                type="button"
                onClick={() => seek(c.start)}
                aria-current={i === chapterIndex ? "true" : undefined}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 px-4 py-2 text-start text-sm transition-colors duration-(--motion) ease-motion hover:bg-muted/60",
                  i === chapterIndex && "bg-primary-tint font-medium",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "w-5 shrink-0 text-xs tabular-nums text-muted-foreground",
                    i === chapterIndex && "text-primary",
                  )}
                >
                  {fa(i + 1)}
                </span>
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <span
                  dir="ltr"
                  className="shrink-0 text-xs tabular-nums text-muted-foreground"
                >
                  {formatDuration(c.start)}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
