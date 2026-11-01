import { cn } from "@/lib/utils";

/** Ant page-header: 20px/600 title with optional trailing action. */
export function SectionHead({
  title,
  action,
  id,
  className,
}: {
  numeral?: string;
  title: string;
  action?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <h2 id={id} className="text-xl leading-7 text-foreground">
        {title}
      </h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Loading placeholder block; the pulse is a real busy signal (R-19, silenced by reduced-motion). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-accent", className)} />;
}
