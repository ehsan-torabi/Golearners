import { cn } from "@/lib/utils";

/** Glass surface card (the theme's primary container). */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass rounded-surface", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-base text-foreground", className)} {...props} />;
}

/** Small pill badge from tokens only. */
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-line px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}
