import { cn } from "@/lib/utils";

type Tone = "destructive" | "success";

/** Inline result box for form errors and confirmations (R-27 error/success states). */
export function Alert({
  tone = "destructive",
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      role={tone === "destructive" ? "alert" : "status"}
      className={cn(
        "rounded-field border px-4 py-3 text-sm leading-7",
        tone === "destructive"
          ? "border-destructive/30 bg-destructive/10 text-destructive-text"
          : "border-success/30 bg-success/10 text-success-text",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
