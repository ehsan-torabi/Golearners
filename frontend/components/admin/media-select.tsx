"use client";

import * as React from "react";
import { Field, Select } from "@/components/ui/input";
import { fetchMedia, type MediaAsset } from "@/lib/admin";

/**
 * Picks a stored media asset for a cover/promo slot.
 * The admin media API exposes no public URL, so the option label is the
 * storage key and the empty option is the honest "no media" state.
 */
export function MediaSelect({
  id,
  label,
  hint,
  kind,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  kind: "image" | "video";
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const [items, setItems] = React.useState<MediaAsset[]>([]);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");

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
    <Field
      label={label}
      htmlFor={id}
      hint={state === "error" ? "بارگذاری فهرست رسانه‌ها ناموفق بود؛ دوباره تلاش کنید." : hint}
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
            {m.storage_key}
          </option>
        ))}
      </Select>
    </Field>
  );
}
