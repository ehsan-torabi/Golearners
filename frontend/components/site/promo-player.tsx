"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { VideoPlayer } from "@/components/ui/video-player";

/**
 * Promo clip in the course buy-card: the cover acts as the poster with a
 * play button on top; on play it fetches the signed promo URL (public,
 * per-IP rate limited) and mounts the vibefarsi player in place.
 */
export function PromoPlayer({
  slug,
  poster,
  title,
}: {
  slug: string;
  poster?: string;
  title: string;
}) {
  const [url, setUrl] = React.useState("");
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function play() {
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch(
        `/api/v1/playback/courses/${encodeURIComponent(slug)}/promo`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { playback_url: string };
      setUrl(body.playback_url);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (url) {
    return (
      <VideoPlayer
        src={url}
        title={`ویدیوی معرفی ${title}`}
        className="aspect-video w-full rounded-none border-0"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => void play()}
      disabled={busy}
      aria-label={`پخش ویدیوی معرفی ${title}`}
      className="group relative block aspect-video w-full overflow-hidden bg-primary-tint"
    >
      {poster && (
        <img
          src={poster}
          alt=""
          className="media-dim absolute inset-0 size-full object-cover transition-transform duration-(--motion-slow) ease-motion group-hover:scale-105"
        />
      )}
      {!poster && (
        <span aria-hidden className="font-display text-6xl font-semibold text-primary/40">
          {title.slice(0, 2)}
        </span>
      )}
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-invert/35 transition-colors duration-(--motion) ease-motion group-hover:bg-invert/45"
      >
        <span className="flex size-16 items-center justify-center rounded-full border border-border bg-card text-primary shadow-raise transition-transform duration-(--motion) ease-motion group-hover:scale-105">
          <Play className="size-7 translate-x-0.5 fill-current" strokeWidth={1.5} />
        </span>
      </span>
      <span className="absolute bottom-3 start-3 rounded-tag bg-invert/75 px-2.5 py-1 text-xs font-medium text-invert-foreground">
        ویدیوی معرفی دوره
      </span>
      {failed && (
        <span className="absolute inset-x-0 bottom-10 text-center">
          <span className="inline-block rounded-tag bg-invert/75 px-2.5 py-1 text-xs text-invert-foreground">
            پخش ویدیوی معرفی در دسترس نیست.
          </span>
        </span>
      )}
    </button>
  );
}
