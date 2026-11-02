import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* Section head, «هزاران آموزش» style: right-aligned title with an optional
   «دیدن همه» trailing link that points at a real destination. */
export function SectionHead({
  title,
  action,
  href,
  id,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  href?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <h2 id={id} className="text-xl leading-8 text-foreground md:text-2xl">
        {title}
      </h2>
      {action && <div className="shrink-0">{action}</div>}
      {!action && href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent-strong transition-colors hover:text-primary-hover"
        >
          دیدن همه
          <ChevronLeftIcon className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Loading placeholder block; the pulse is a real busy signal (R-19, silenced by reduced-motion). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-accent", className)} />;
}
