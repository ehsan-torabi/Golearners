import { cn } from "@/lib/utils";

const field =
  "h-11 w-full rounded-field border-line bg-field px-3 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-field transition-colors duration-(--motion) ease-motion focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "min-h-28 py-2", className)} {...props} />;
}

/** Label above the field, per VibeFarsi form rules. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground/90">
        {label}
        {required && <span className="ms-1 text-destructive">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
