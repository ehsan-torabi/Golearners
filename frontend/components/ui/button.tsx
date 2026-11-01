import { cn } from "@/lib/utils";
import Link from "next/link";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

/* primary: شنگرف fill + ink border (boundary carries the 3:1, see DESIGN.md)
   secondary: ink/paper inversion block; outline: quiet sibling; ghost: inline actions */
const variants: Record<Variant, string> = {
  primary:
    "border border-ink bg-primary text-primary-foreground hover:brightness-105 shadow-flat",
  secondary: "border border-ink bg-secondary text-secondary-foreground hover:opacity-90",
  outline: "border border-line bg-card text-foreground hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-lg",
};

const base =
  "inline-flex min-w-11 items-center justify-center gap-2 rounded-control font-medium transition-[transform,background-color,border-color,opacity] duration-(--motion) ease-motion active:[transform:var(--press)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  type = "button",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: ButtonLinkProps) {
  return <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
