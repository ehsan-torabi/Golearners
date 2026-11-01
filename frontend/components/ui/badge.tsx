import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "destructive" | "accent";

/* rounded-full is reserved for real status labels only (DESIGN.md) */
const tones: Record<Tone, string> = {
  neutral: "border-line bg-muted text-muted-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
  accent: "border-accent-strong/30 bg-accent-strong/10 text-accent-strong",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
