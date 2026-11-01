"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

import { usePersianDigitsInput } from "@/hooks/use-persian-digits-input"
import { type PersianDigitsMode } from "@/lib/digits"

type InputProps = React.ComponentProps<"input"> & {
  /**
   * Display Persian digits while keeping the logical/submitted value in ASCII.
   * - `"auto"` (default): enabled in Persian contexts for text/numeric/tel.
   * Skipped for email/password/url/file and when `data-persian-digits="false"`
   * or `lang="en"`. `dir="ltr"` does NOT disable Persian digits.
   * - `true` / `false`: force on or off
   */
  persianDigits?: PersianDigitsMode
  onValueChange?: (value: string, eventDetails: unknown) => void
}

function Input({
  className,
  type,
  inputMode,
  dir,
  lang,
  name,
  value,
  defaultValue,
  onChange,
  onValueChange,
  placeholder,
  persianDigits = "auto",
  ref,
  ...props
}: InputProps & { ref?: React.Ref<HTMLElement> }) {
  const dataPersianDigits =
    typeof (props as Record<string, unknown>)["data-persian-digits"] === "string"
      ? ((props as Record<string, unknown>)["data-persian-digits"] as string)
      : null

  const {
    enabled,
    isNumeric,
    setInputRef,
    inputProps,
    hiddenInput,
    formatPlaceholder,
    toLatinValue,
  } = usePersianDigitsInput({
    persianDigits,
    type,
    inputMode,
    dir,
    lang,
    name,
    value,
    defaultValue,
    onChange,
    "data-persian-digits": dataPersianDigits,
  })

  const composedRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      setInputRef(node)
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLElement | null>).current = node
      }
    },
    [ref, setInputRef]
  )

  return (
    <>
      {hiddenInput ? <input {...hiddenInput} readOnly tabIndex={-1} /> : null}
      <InputPrimitive
        data-slot="input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-field px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...props}
        {...inputProps}
        placeholder={formatPlaceholder(placeholder)}
        ref={composedRef}
        onValueChange={(next, eventDetails) => {
          const latin =
            enabled || isNumeric
              ? toLatinValue(String(next ?? ""))
              : String(next ?? "")
          onValueChange?.(latin, eventDetails)
        }}
      />
    </>
  )
}

export { Input }
export type { InputProps }

export { Textarea } from "@/components/ui/textarea"

/* native select for simple lists (filters, admin forms); the base-ui Select
   in ui/select.tsx serves the profile block's item-based API */
function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-field px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

/** Label above the field; hint and error are exclusive. */
function Field({
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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ms-1 text-destructive-text" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive-text">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export { Select, Field }
