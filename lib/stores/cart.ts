"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem =
  | {
      kind: "product";
      productId: string;
      variantId: string;
      name: string;
      size: string | null;
      color: string | null;
      price: number;
      qty: number;
      imageUrl: string | null;
    }
  | {
      kind: "accessory";
      // Which product this accessory was added alongside — lets the cart UI
      // group the accessory under its parent product line instead of
      // rendering it as an unrelated item with no photo of its own.
      productId: string;
      accessoryId: string;
      name: string;
      price: number;
      qty: number;
    };

export function cartItemKey(item: CartItem): string {
  return item.kind === "product"
    ? `product:${item.productId}:${item.variantId}`
    : `accessory:${item.productId}:${item.accessoryId}`;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const key = cartItemKey(item);
          const existing = state.items.find((i) => cartItemKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i) === key ? { ...i, qty: i.qty + item.qty } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => cartItemKey(i) !== key),
        })),

      updateQty: (key, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => cartItemKey(i) !== key)
              : state.items.map((i) => (cartItemKey(i) === key ? { ...i, qty } : i)),
        })),

      clearCart: () => set({ items: [] }),

      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: "kiddie-chic-cart",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Carts persisted before this change have items with no `kind` field —
      // stamp them as "product" (the only kind that existed back then) so
      // returning shoppers don't lose their cart or crash the page. Carts
      // from v1 have accessory items with no `productId` (added before we
      // tracked which product they belong to) — fall back to "" so they
      // render as ungrouped orphans in the cart instead of crashing.
      migrate: (persisted) => {
        const state = persisted as { items?: Array<Record<string, unknown>> } | undefined;
        if (!state?.items) return { items: [] };
        return {
          items: state.items.map((i) => {
            if (!i.kind) return { ...i, kind: "product" };
            if (i.kind === "accessory" && typeof i.productId !== "string") {
              return { ...i, productId: "" };
            }
            return i;
          }),
        };
      },
    }
  )
);
