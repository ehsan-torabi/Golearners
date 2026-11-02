"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/api";

const ACCEPT: Record<MediaKind, string> = {
  image: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/quicktime",
  pdf: "application/pdf",
};

const MAX_BYTES: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024,
  video: 2 * 1024 * 1024 * 1024,
  pdf: 50 * 1024 * 1024,
};

export type MediaKind = "image" | "video" | "pdf";

type Ticket = { upload_url: string; storage_key: string; kind: string };

/**
 * Direct-to-storage uploader for the admin console.
 * Flow: presign → PUT to the signed URL → register the asset with the API.
 * The API re-checks the stored object, so the browser never decides the size.
 */
export function MediaUploader({
  kind,
  label,
  onUploaded,
}: {
  kind: MediaKind;
  label: string;
  onUploaded: (asset: { id: string; storage_key: string; kind: string }) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();

  async function upload(file: File) {
    setError("");
    setDone("");
    if (file.size > MAX_BYTES[kind]) {
      setError(
        kind === "image"
          ? "حجم تصویر بیش از ۱۰ مگابایت است."
          : kind === "video"
            ? "حجم ویدیو بیش از ۲ گیگابایت است."
            : "حجم فایل PDF بیش از ۵۰ مگابایت است.",
      );
      return;
    }
    setBusy(true);
    try {
      const ticket = await api<Ticket>("/admin/media/presign", {
        method: "POST",
        body: JSON.stringify({ mime: file.type, size_bytes: file.size, filename: file.name }),
      });
      const put = await fetch(ticket.upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("بارگذاری فایل روی فضای ذخیره‌سازی ناموفق بود.");
      const asset = await api<{ id: string; storage_key: string; kind: string }>("/admin/media", {
        method: "POST",
        body: JSON.stringify({
          storage_key: ticket.storage_key,
          filename: file.name,
          mime: file.type,
          size_bytes: file.size,
          checksum: "",
        }),
      });
      setDone(kind === "video" ? "فایل بارگذاری شد و در حال پردازش است." : "فایل بارگذاری شد.");
      onUploaded(asset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری فایل ناموفق بود.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT[kind]}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          loading={busy}
          onClick={() => inputRef.current?.click()}
        >
          انتخاب فایل
        </Button>
        <span className="text-xs text-muted-foreground">
          {kind === "image" ? "JPG، PNG یا WebP" : kind === "video" ? "MP4 یا MOV" : "PDF"}
        </span>
      </div>
      {busy && <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>}
      {done && <p className="text-xs text-success-text">{done}</p>}
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
