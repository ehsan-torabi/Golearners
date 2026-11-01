import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/* Ant Tag: 4px radius, low-saturation fill + the palette's darker text step.
   rounded-full stays reserved for real status dots (DESIGN.md). */
const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-tag border px-1.5 py-0 text-xs leading-5 whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      tone: {
        neutral: "border-border-variant bg-muted text-muted-foreground",
        success: "border-transparent bg-success-bg text-success-text",
        warning: "border-transparent bg-warning-bg text-warning-text",
        destructive: "border-transparent bg-destructive-bg text-destructive-text",
        accent: "border-transparent bg-primary-tint text-accent-strong",
        info: "border-transparent bg-info-bg text-info-text",
      },
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    tone?: "neutral" | "success" | "warning" | "destructive" | "accent" | "info"
  }

function Badge({ className, tone, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        badgeVariants({ ...(tone ? { tone } : { variant: variant ?? "default" }), className }),
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
