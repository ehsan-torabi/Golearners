import { cn } from "@/lib/utils";

/** Identity motif: oversized Lalezar Persian numeral beside the section heading (DESIGN.md). */
export function SectionHead({
  numeral,
  title,
  action,
  id,
  className,
}: {
  numeral: string;
  title: string;
  action?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-end gap-3", className)}>
      <span aria-hidden className="font-display text-4xl leading-none text-accent-display">
        {numeral}
      </span>
      <h2 id={id} className="font-display text-2xl text-foreground">
        {title}
      </h2>
      {action && <div className="ms-auto">{action}</div>}
    </div>
  );
}

/** Loading placeholder block; the pulse is a real busy signal (R-19, silenced by reduced-motion). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-field bg-muted", className)} />;
}
