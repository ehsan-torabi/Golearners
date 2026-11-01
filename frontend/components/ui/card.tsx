import { cn } from "@/lib/utils";

/** Flat poster surface: warm card + hairline border. Shadow only on hover-lift callers. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-surface border border-line bg-card text-card-foreground", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-lg text-foreground", className)} {...props} />;
}
