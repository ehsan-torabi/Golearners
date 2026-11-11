"use client";

import * as React from "react";
import { CopyIcon, Loader2, Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const shareEntries = [
  {
    label: "تلگرام",
    href: (url: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
        document.title,
      )}`,
    rel: "noopener noreferrer",
  },
  {
    label: "واتس‌اپ",
    href: (url: string) =>
      `https://wa.me/?text=${encodeURIComponent(document.title + " " + url)}`,
    rel: "noopener noreferrer",
  },
  {
    label: "لینکدین",
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    rel: "noopener noreferrer",
  },
  {
    label: "توییتر",
    href: (url: string) =>
      `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(
        document.title,
      )}`,
    rel: "noopener noreferrer",
  },
];

export function ShareRail({ url }: { url: string }) {
  const absolute =
    url.startsWith("http") ? url : `${typeof location !== "undefined" ? location.origin : ""}${url}`;
  return (
    <div className="flex flex-col lg:flex-row gap-2 border-t border-line pt-8 mb-12 lg:mb-0">
      <ShareSheet absolute={absolute} />
    </div>
  );
}

function ShareSheet({ absolute }: { absolute: string }) {
  const [copied, setCopied] = React.useState(false);
  const [copyFailed, setCopyFailed] = React.useState(false);
  // share URLs read document.title, which only exists in the browser —
  // compute them after mount so SSR never touches `document`
  const [links, setLinks] = React.useState<{ label: string; href: string; rel: string }[]>([]);
  React.useEffect(() => {
    setLinks(shareEntries.map((entry) => ({ label: entry.label, href: entry.href(absolute), rel: entry.rel })));
  }, [absolute]);
  return (
    <Sheet>
      <SheetTrigger>
        <Button
          variant="outline"
          size="icon"
          aria-label="اشتراک‌گذاری این مقاله"
          className="rounded-full w-11 h-11"
        >
          <Share2Icon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="p-5 w-full sm:w-80" dir="rtl" lang="fa">
        <p className="mb-4 text-xs font-medium text-muted-foreground">اشتراک‌گذاری</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {links.map((entry) => (
            <a
              key={entry.label}
              href={entry.href}
              target="_blank"
              rel={entry.rel}
              className="flex h-10 flex-col items-center justify-center rounded-md border border-line bg-card text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary-tint"
            >
              {entry.label}
            </a>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard
              .writeText(absolute)
              .then(() => {
                setCopied(true);
                setCopyFailed(false);
                setTimeout(() => setCopied(false), 2000);
              })
              .catch(() => setCopyFailed(true));
          }}
          className="w-full gap-1"
        >
          {copied ? (
            <>
              <Loader2 className="size-4 animate-spin" /> کپی شد
            </>
          ) : (
            <>
              <CopyIcon className="size-4" /> کپی لینک مقاله
            </>
          )}
        </Button>
        {copyFailed && (
          <p className="mt-2 text-xs text-destructive-text">
            کپی خودکار ممکن نشد؛ لینک را از نوار آدرس دستی کپی کنید.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
