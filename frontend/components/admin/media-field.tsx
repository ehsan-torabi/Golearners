"use client";

import * as React from "react";
import { Field, Select } from "@/components/ui/input";
import { MediaUploader } from "@/components/admin/media-uploader";
import { fetchMedia, type MediaAsset } from "@/lib/admin";

const STATUS_FA: Record<string, string> = {
  ready: "آماده",
  uploaded: "در صف پردازش",
  processing: "در حال پردازش",
  failed: "ناموفق",
};

/** Picker label: the human filename with its pipeline status. */
function mediaLabel(m: MediaAsset): string {
  const name = m.filename || m.storage_key.split("/").slice(-1)[0];
  return `${name} · ${STATUS_FA[m.status] ?? m.status}`;
}

/**
 * Media slot field: pick a stored asset or upload a new one in place.
 * Options show the original filename; image picks preview via the public
 * media endpoint. The empty option is the honest "no media" state.
 */
export function MediaField({
  id,
  label,
  hint,
  kind,
  value,
  onChange,
  uploaderLabel,
}: {
  id: string;
  label: string;
  hint?: string;
  kind: "image" | "video";
  value: string | null;
  onChange: (next: string | null) => void;
  uploaderLabel?: string;
}) {
  const [items, setItems] = React.useState<MediaAsset[]>([]);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");

  const load = React.useCallback(async () => {
    try {
      const res = await fetchMedia(kind);
      setItems(res.data);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [kind]);

  React.useEffect(() => {
    let alive = true;
    setState("loading");
    fetchMedia(kind)
      .then((res) => {
        if (!alive) return;
        setItems(res.data);
        setState("ready");
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, [kind]);

  const selected = items.find((m) => m.id === value) ?? null;

  return (
    <div className="space-y-3">
      <Field
        label={label}
        htmlFor={id}
        hint={
          state === "error"
            ? "بارگذاری فهرست رسانه‌ها ناموفق بود؛ دوباره تلاش کنید."
            : hint
        }
      >
        <Select
          id={id}
          value={value ?? ""}
          disabled={state === "loading"}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">
            {state === "loading" ? "در حال بارگذاری…" : "انتخاب نشده"}
          </option>
          {items.map((m) => (
            <option key={m.id} value={m.id}>
              {mediaLabel(m)}
            </option>
          ))}
        </Select>
      </Field>

      {selected && kind === "image" && selected.url && (
        <img
          src={selected.url}
          alt={mediaLabel(selected)}
          className="h-36 w-auto max-w-full rounded-field border border-line object-cover"
        />
      )}

      <MediaUploader
        kind={kind}
        label={uploaderLabel ?? "بارگذاری فایل تازه"}
        onUploaded={(asset) => {
          void load();
          onChange(asset.id);
        }}
      />
    </div>
  );
}
