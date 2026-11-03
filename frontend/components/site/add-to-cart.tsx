"use client";

import { CheckIcon, ShoppingCartIcon } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { useCart, type CartItem } from "@/lib/cart";

/** The course-page CTA: add to the cart, or jump to the cart when present.
    Guests can add freely; sign-in is asked for at pay time. */
export function AddToCartButton({ item }: { item: CartItem }) {
  const { has, add } = useCart();
  const inCart = has(item.course_id);

  if (inCart) {
    return (
      <ButtonLink href="/cart" className="w-full" size="lg" variant="secondary">
        <CheckIcon className="size-4.5" aria-hidden />
        مشاهده سبد خرید
      </ButtonLink>
    );
  }
  return (
    <Button className="w-full" size="lg" onClick={() => add(item)}>
      <ShoppingCartIcon className="size-4.5" aria-hidden />
      افزودن به سبد خرید
    </Button>
  );
}
