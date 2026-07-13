# Product Accessories — Design

**Date:** 2026-07-13
**Status:** Approved

## Overview

Some dresses can have optional accessories attached (Обруч / Рукавички / Сумочка / Чокер — a fixed, closed list of 4 types). Admin picks which accessory types apply to a given dress and sets a price per type per dress. On the product page, shoppers can add any of the dress's accessories to the cart as their own independent line item (not bundled with the dress). Checkout persists and prices them server-side, same trust model as dress variants today.

---

## 1. Database Schema Change

Two new tables, purely additive — `Product`, `ProductVariant`, `Order`, `OrderItem` are untouched.

```prisma
enum AccessoryType {
  headband   // Обруч
  gloves     // Рукавички
  bag        // Сумочка
  choker     // Чокер
}

model ProductAccessory {
  id        String        @id @default(cuid())
  productId String
  type      AccessoryType
  price     Decimal       @db.Decimal(10, 2)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, type])
}

model OrderAccessoryItem {
  id      String  @id @default(cuid())
  orderId String
  name    String  // snapshot at order time, e.g. "Обруч"
  price   Decimal @db.Decimal(10, 2)
  qty     Int     @default(1)

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}
```

Add back-relations: `Product.accessories ProductAccessory[]`, `Order.accessoryItems OrderAccessoryItem[]`.

Migration: `npx prisma migrate dev --name add-product-accessories`

`AccessoryType` is a closed, code-controlled enum (same pattern as `ProductCategory`) — no admin UI to add new types. A product can't have the same accessory type attached twice (`@@unique`).

**Type names (uk/en)** live in `lib/catalog.ts` as a new constant, same pattern as `COLORS`/`SIZES`:

```ts
export const ACCESSORY_TYPES: { id: AccessoryType; name_uk: string; name_en: string }[] = [
  { id: 'headband', name_uk: 'Обруч', name_en: 'Headband' },
  { id: 'gloves', name_uk: 'Рукавички', name_en: 'Gloves' },
  { id: 'bag', name_uk: 'Сумочка', name_en: 'Bag' },
  { id: 'choker', name_uk: 'Чокер', name_en: 'Choker' },
];
```

---

## 2. Admin UI

**File:** `components/admin/ProductForm.tsx`

New section **"Аксесуари"**, placed right after the existing "Варіанти (розмір/ціна)" section, same UX pattern:

- Button **"+ Додати аксесуар"** — opens a picker limited to accessory types not already added to this product (max 4 rows total).
- Each added row: fixed type name (read-only label) + "Ціна, ₴" number input + "Видалити" button.
- No enable/disable checkbox — an empty list simply means the dress has no accessories, and the storefront shows nothing. This mirrors how the existing variants list works (no separate "has variants" flag either).

**Validation (`lib/validation/product.ts`):** new optional array field

```ts
accessories: z.array(z.object({
  type: z.enum(['headband', 'gloves', 'bag', 'choker']),
  price: z.coerce.number().positive(),
})).default([]),
```

**`app/admin/products/actions.ts`:** `createProductAction`/`updateProductAction` replace the product's `accessories` set wholesale on save (delete + recreate), same approach already used for `variants`.

---

## 3. Product Page (Catalog)

**File:** `components/features/catalog/ProductDetail.tsx`

If `product.accessories.length > 0`, render a new **"Аксесуари"** block directly under the "Купити" button (above the WhatsApp secondary CTAs):

```
Аксесуари
[ Обруч         150₴  [+] ]
[ Чокер         200₴  [+] ]
```

Each row: localized type name (uk/en) + price + a small "+" button that adds the accessory to the cart as qty 1 (repeated clicks increment qty via the existing cart dedup logic).

`lib/products.ts` / `lib/catalog.ts` `Product` type gains:

```ts
accessories: { id: string; type: string; price: number }[];
```

---

## 4. Cart

**File:** `lib/stores/cart.ts`

`CartItem` becomes a discriminated union — existing dress items are untouched in shape, accessories are a new variant:

```ts
export type CartItem =
  | {
      kind: 'product';
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
      kind: 'accessory';
      accessoryId: string; // ProductAccessory.id
      name: string;
      price: number;
      qty: number;
    };
```

- `kind` is added to existing dress items too (small migration of the persisted Zustand shape — see §6).
- Dedup / qty logic in `addItem`/`removeItem`/`updateQty` matches by `productId+variantId` for `kind: 'product'`, by `accessoryId` for `kind: 'accessory'`.

**File:** `components/features/cart/CartView.tsx` — render accessory rows without image/size/color, same qty +/- and remove controls as today.

---

## 5. Checkout

**File:** `app/[locale]/(checkout)/checkout/actions.ts`

`PlaceOrderPayload.items: CartItem[]` now may contain both kinds. Server-side price resolution:

- `kind: 'product'` items: unchanged — resolved against `ProductVariant`.
- `kind: 'accessory'` items: resolved against `ProductAccessory` by `accessoryId` (never trust client price), same fail-closed behavior as today (missing/mismatched id → reject the order).

`prisma.order.create` gains a second nested write:

```ts
accessoryItems: {
  create: resolvedAccessoryItems.map((i) => ({
    name: i.name,
    price: i.price,
    qty: i.qty,
  })),
},
```

**File:** `lib/telegram.ts` — `sendNewOrderNotification` already accepts a generic `items: { name, size, color, price, qty }[]`. Accessory items are folded into the same list with `size: null, color: null` — no changes needed to the Telegram message builder itself, just to what `placeOrder` passes in.

---

## 6. Zustand Persisted Cart Migration

Existing users may have a persisted cart in `localStorage` from before this change (items without `kind`). Add a `migrate` function to the `persist` config that stamps `kind: 'product'` onto any item missing it, so old carts don't break on the next visit.

---

## 7. Out of Scope

- Accessory photos — text + price only, per earlier decision.
- Admin-managed accessory type list (types are hardcoded, not DB-editable).
- Standalone accessory browsing/catalog page — accessories are only reachable from a dress's product page.
- Editing/removing accessories from an already-placed order (existing admin order tooling, if any, is unaffected — `OrderAccessoryItem` is additive).
