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

/**
 * Media slot field: pick a stored asset or upload a new one in place.
 * The admin media API exposes no public URL, so the option label is the
 * storage key and the empty option is the honest "no media" state.
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
            {state === "loading" ? "در حال بارگذاری…" : "— انتخاب نشده —"}
          </option>
          {items.map((m) => (
            <option key={m.id} value={m.id}>
              {m.storage_key.split("/").slice(-1)[0]} · {STATUS_FA[m.status] ?? m.status}
            </option>
          ))}
        </Select>
      </Field>

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
