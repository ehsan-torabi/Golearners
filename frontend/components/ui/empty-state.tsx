import { cn } from "@/lib/utils";
import Link from "next/link";

/** Empty state that names the cause and offers the next action (R-27). */
export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  className,
}: {
  title: string;
  body?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-surface border border-dashed border-line bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      <p className="font-semibold text-lg text-foreground">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">{body}</p>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-10 items-center rounded-control border border-ink bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
