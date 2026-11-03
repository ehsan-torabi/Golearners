"use client";

import * as React from "react";

export interface CartItem {
  course_id: string;
  slug: string;
  title: string;
  price_rial: number;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  add: (item: CartItem) => void;
  remove: (courseId: string) => void;
  has: (courseId: string) => boolean;
  clear: () => void;
}

const CartContext = React.createContext<CartState | null>(null);
const STORAGE_KEY = "golearn.cart.v1";

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((it) => it && it.course_id && it.slug) : [];
  } catch {
    return [];
  }
}

/** Client-side cart (localStorage): the order itself is snapshotted
    server-side at pay time, so stale local prices are harmless. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  const persist = React.useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // private mode: the cart lives for this page view only
    }
  }, []);

  const add = React.useCallback(
    (item: CartItem) => {
      persist([...readStorage().filter((it) => it.course_id !== item.course_id), item]);
    },
    [persist],
  );

  const remove = React.useCallback(
    (courseId: string) => {
      persist(readStorage().filter((it) => it.course_id !== courseId));
    },
    [persist],
  );

  const clear = React.useCallback(() => persist([]), [persist]);
  const has = React.useCallback((courseId: string) => items.some((it) => it.course_id === courseId), [items]);

  const value = React.useMemo<CartState>(
    () => ({ items, hydrated, add, remove, has, clear }),
    [items, hydrated, add, remove, has, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
