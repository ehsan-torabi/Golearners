"use client";

import Link from "next/link";
import { ShoppingCartIcon } from "lucide-react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

/** Header entry for the cart: icon + count, styled as a nav action. */
export function CartLink({ stacked = false }: { stacked?: boolean }) {
  const { items, hydrated } = useCart();
  const count = items.length;
  return (
    <Link
      href="/cart"
      aria-label={`سبد خرید${count > 0 ? `، ${count} دوره` : ""}`}
      className={cn(
        "relative inline-flex items-center justify-center rounded-control border border-border text-muted-foreground transition-colors duration-(--motion) ease-motion hover:border-primary/40 hover:bg-primary-tint hover:text-accent-strong",
        stacked ? "h-9 w-full gap-2 px-3 text-sm" : "size-8",
      )}
    >
      <ShoppingCartIcon className="size-4" aria-hidden />
      {stacked && <span>سبد خرید</span>}
      {hydrated && count > 0 && (
        <span className="absolute -top-1.5 -start-1.5 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
          {count.toLocaleString("fa-IR")}
        </span>
      )}
    </Link>
  );
}
