import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm leading-(--leading-control) font-medium whitespace-nowrap shadow-none transition-all duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* primary: solid AA-safe Ant blue; hover/active darken (light theme) */
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:not-aria-[haspopup]:bg-primary-active",
        outline:
          "border-border bg-card text-foreground hover:border-primary hover:text-primary active:not-aria-[haspopup]:bg-muted aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:border-primary hover:text-primary active:not-aria-[haspopup]:bg-muted",
        ghost:
          "hover:bg-muted hover:text-foreground active:not-aria-[haspopup]:bg-muted/80 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "border-destructive/30 bg-destructive-bg text-destructive-text hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-accent-strong underline-offset-4 shadow-none hover:underline active:not-aria-[haspopup]:translate-y-0",
      },
      size: {
        default: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]> | "primary"
type Size = NonNullable<VariantProps<typeof buttonVariants>["size"]> | "md"
type ButtonProps = Omit<ButtonPrimitive.Props, "variant" | "size"> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const normVariant = (v: Variant | undefined) => (v === "primary" ? "default" : v) as VariantProps<typeof buttonVariants>["variant"]
const normSize = (v: Size | undefined) => (v === "md" ? "default" : v) as VariantProps<typeof buttonVariants>["size"]

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant: normVariant(variant), size: normSize(size), className }))}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </ButtonPrimitive>
  )
}

type ButtonLinkProps = Omit<React.ComponentProps<typeof Link>, "variant" | "size"> & {
  variant?: Variant
  size?: Size
}

function ButtonLink({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      data-slot="button"
      className={cn(buttonVariants({ variant: normVariant(variant), size: normSize(size), className }))}
      {...props}
    />
  )
}

export { Button, ButtonLink, buttonVariants }
