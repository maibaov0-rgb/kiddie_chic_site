# Product Accessories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins attach a fixed set of accessories (Обруч / Рукавички / Сумочка / Чокер) to individual dresses with per-dress pricing, show them on the product page, and let shoppers add them to the cart as independent line items that flow through checkout.

**Architecture:** Two new, purely-additive Prisma tables (`ProductAccessory`, `OrderAccessoryItem`) — no existing table is altered. The cart's `CartItem` becomes a discriminated union (`kind: 'product' | 'accessory'`) so accessory lines don't need a fake `productId`/`variantId`. Checkout resolves accessory prices from the DB the same way it already does for dress variants (never trust client-supplied prices).

**Tech Stack:** Next.js 15 App Router, Prisma v7, Zod v4, react-hook-form, Zustand (persist middleware), next-intl, Node.js built-in `node:test` for unit tests.

## Global Constraints

- TS strict — no `any`, use `unknown` + narrowing (project CLAUDE.md).
- No hardcoded UI strings in public-facing (next-intl-driven) components — admin panel is Ukrainian-only by existing convention and does not use next-intl (verified: `ProductForm.tsx` uses plain literals throughout).
- `npm run lint && npm run typecheck` must pass before any task is considered done; this is necessary but not sufficient — the final task requires driving the actual UI per CLAUDE.md's `verify` requirement.
- Rounded corners / soft shadows / brand palette per CLAUDE.md design rules — new UI elements must reuse existing Tailwind classes already used for sibling elements (`rounded-full`, `rounded-2xl`, `rounded-3xl`, `shadow-card`, `shadow-soft`), not introduce new ad hoc styles.
- Never change existing columns/tables — accessory support must be additive only (spec requirement, confirmed with user).
- Test runner: `node --test <file>.test.ts` (no Jest/Vitest in this repo — confirmed via `package.json` and existing `lib/*.test.ts` files).

---

### Task 1: Database schema — `AccessoryType`, `ProductAccessory`, `OrderAccessoryItem`

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma Client types `AccessoryType`, `ProductAccessory`, `OrderAccessoryItem`, plus `Product.accessories` and `Order.accessoryItems` relations — every later task that touches Prisma queries depends on these.

- [ ] **Step 1: Add the `AccessoryType` enum**

In `prisma/schema.prisma`, insert this new enum right after the existing `enum PaymentMethod { ... }` block (around line 85):

```prisma
enum AccessoryType {
  headband // Обруч
  gloves   // Рукавички
  bag      // Сумочка
  choker   // Чокер
}
```

- [ ] **Step 2: Add the `accessories` relation to `Product`**

In the `model Product { ... }` block, find this line:

```prisma
  variants   ProductVariant[]
  orderItems OrderItem[]
```

Change it to:

```prisma
  variants    ProductVariant[]
  accessories ProductAccessory[]
  orderItems  OrderItem[]
```

- [ ] **Step 3: Add the `ProductAccessory` model**

Insert this new model right after the existing `model ProductVariant { ... }` block:

```prisma
model ProductAccessory {
  id        String        @id @default(cuid())
  productId String
  type      AccessoryType
  price     Decimal       @db.Decimal(10, 2)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, type])
}
```

- [ ] **Step 4: Add the `accessoryItems` relation to `Order`**

In the `model Order { ... }` block, find this line:

```prisma
  items       OrderItem[]
  totalAmount Decimal       @db.Decimal(10, 2)
```

Change it to:

```prisma
  items          OrderItem[]
  accessoryItems OrderAccessoryItem[]
  totalAmount    Decimal               @db.Decimal(10, 2)
```

- [ ] **Step 5: Add the `OrderAccessoryItem` model**

Insert this new model right after the existing `model OrderItem { ... }` block:

```prisma
model OrderAccessoryItem {
  id      String  @id @default(cuid())
  orderId String
  name    String // snapshot at order time, e.g. "Обруч"
  price   Decimal @db.Decimal(10, 2)
  qty     Int     @default(1)

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}
```

- [ ] **Step 6: Ensure the local Postgres container is running**

```bash
docker ps --filter "name=kiddie_chic_db" --format "{{.Names}} {{.Status}}"
```

Expected: a line like `kiddie_chic_db   Up ... (healthy)`. If nothing prints, start Docker Desktop and wait until `docker ps` shows it healthy before continuing (the compose file already defines this container — do not create a new one).

- [ ] **Step 7: Run the migration**

```bash
npx prisma migrate dev --name add-product-accessories
```

Expected: `Your database is now in sync with your schema.` and a new folder under `prisma/migrations/` with a name ending in `add-product-accessories`. This also regenerates the Prisma Client (`app/generated/prisma`).

- [ ] **Step 8: Verify the client picked up the new types**

```bash
npx tsc --noEmit -p . 2>&1 | grep -i "accessor" || echo "no accessory-related type errors"
```

Expected: `no accessory-related type errors` (unrelated pre-existing errors, if any, are not this task's concern — there should be none at this point since nothing consumes the new types yet).

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add ProductAccessory and OrderAccessoryItem tables"
```

---

### Task 2: `lib/catalog.ts` — accessory type constants and `Product` shape

**Files:**
- Modify: `lib/catalog.ts`
- Create: `lib/catalog.test.ts`

**Interfaces:**
- Consumes: nothing new (pure additions to an existing pure module).
- Produces: `ACCESSORY_TYPES: AccessoryTypeOption[]`, `accessoryTypeName(type: string, en: boolean): string`, `ProductAccessory` interface `{ id: string; type: string; price: number }`, and `Product.accessories: ProductAccessory[]`. Every later task that renders or maps accessories depends on these exact names.

- [ ] **Step 1: Write the failing tests**

Create `lib/catalog.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { accessoryTypeName, ACCESSORY_TYPES } from "./catalog.ts";

test("ACCESSORY_TYPES has exactly the 4 fixed entries", () => {
  assert.deepEqual(
    ACCESSORY_TYPES.map((a) => a.id),
    ["headband", "gloves", "bag", "choker"],
  );
});

test("accessoryTypeName returns the Ukrainian name by default", () => {
  assert.equal(accessoryTypeName("headband", false), "Обруч");
});

test("accessoryTypeName returns the English name when en=true", () => {
  assert.equal(accessoryTypeName("bag", true), "Bag");
});

test("accessoryTypeName falls back to the raw id for an unknown type", () => {
  assert.equal(accessoryTypeName("unknown-type", false), "unknown-type");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
node --test lib/catalog.test.ts
```

Expected: FAIL — `Cannot find module './catalog.ts'` export `accessoryTypeName`/`ACCESSORY_TYPES` (they don't exist yet).

- [ ] **Step 3: Add the accessory constants and helper to `lib/catalog.ts`**

Insert this block after the existing `swatchBackground` function (after line 55, before the `// ─── Product shape` comment):

```ts
// ─── Accessories (fixed, closed list) ──────────────────────────────────────

export type AccessoryType = 'headband' | 'gloves' | 'bag' | 'choker';

export interface AccessoryTypeOption {
  id: AccessoryType;
  name_uk: string;
  name_en: string;
}

export const ACCESSORY_TYPES: AccessoryTypeOption[] = [
  { id: 'headband', name_uk: 'Обруч', name_en: 'Headband' },
  { id: 'gloves', name_uk: 'Рукавички', name_en: 'Gloves' },
  { id: 'bag', name_uk: 'Сумочка', name_en: 'Bag' },
  { id: 'choker', name_uk: 'Чокер', name_en: 'Choker' },
];

export function accessoryTypeName(type: string, en: boolean): string {
  const a = ACCESSORY_TYPES.find((x) => x.id === type);
  return a ? (en ? a.name_en : a.name_uk) : type;
}
```

- [ ] **Step 4: Add `ProductAccessory` and extend `Product`**

In the `// ─── Product shape (mirrors Prisma)` section, find:

```ts
export interface ProductVariant {
  id: string;
  size: string;
  price: number;
}

export interface Product {
```

Change it to:

```ts
export interface ProductVariant {
  id: string;
  size: string;
  price: number;
}

export interface ProductAccessory {
  id: string;
  type: string;
  price: number;
}

export interface Product {
```

Then find, inside `Product`:

```ts
  variants: ProductVariant[]; // empty for couture
}
```

Change it to:

```ts
  variants: ProductVariant[]; // empty for couture
  accessories: ProductAccessory[]; // empty for couture and dresses with no accessories
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
node --test lib/catalog.test.ts
```

Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

Expected: fails at this point — `lib/products.ts`'s `mapProduct` return doesn't satisfy the now-wider `Product` type (missing `accessories`). This is expected; Task 4 fixes it. Confirm the *only* new errors mention `accessories`/`lib/products.ts`, then continue.

- [ ] **Step 7: Commit**

```bash
git add lib/catalog.ts lib/catalog.test.ts
git commit -m "feat: add accessory type constants to lib/catalog"
```

---

### Task 3: `lib/validation/product.ts` — accessory input schema

**Files:**
- Modify: `lib/validation/product.ts`
- Modify: `lib/validation/product.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `accessorySchema`, `AccessoryInput` type, and `productSchema`'s new `accessories: AccessoryInput[]` field (max 4, unique types, positive price). `ProductInput` (the inferred output type) now includes `accessories`.

- [ ] **Step 1: Write the failing tests**

Append to `lib/validation/product.test.ts` (after the existing 4 tests, before end of file):

```ts
test("accepts a product with accessories", () => {
  const r = productSchema.safeParse({
    ...valid,
    accessories: [
      { type: "headband", price: 150 },
      { type: "choker", price: 200 },
    ],
  });
  assert.equal(r.success, true);
});

test("defaults accessories to an empty array when omitted", () => {
  const r = productSchema.safeParse(valid);
  assert.equal(r.success, true);
  if (r.success) assert.deepEqual(r.data.accessories, []);
});

test("rejects an accessory with a non-positive price", () => {
  const r = productSchema.safeParse({
    ...valid,
    accessories: [{ type: "headband", price: 0 }],
  });
  assert.equal(r.success, false);
});

test("rejects duplicate accessory types on the same product", () => {
  const r = productSchema.safeParse({
    ...valid,
    accessories: [
      { type: "headband", price: 150 },
      { type: "headband", price: 180 },
    ],
  });
  assert.equal(r.success, false);
});

test("rejects an unknown accessory type", () => {
  const r = productSchema.safeParse({
    ...valid,
    accessories: [{ type: "necklace", price: 150 }],
  });
  assert.equal(r.success, false);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
node --test lib/validation/product.test.ts
```

Expected: FAIL — `accessories` is not a recognized key, or the new tests fail because the field doesn't exist yet (the schema currently has no `accessories` field, so `safeParse` succeeds without validating it, and `r.data.accessories` is `undefined`, not `[]`).

- [ ] **Step 3: Add the accessory schema to `lib/validation/product.ts`**

Replace the full file with:

```ts
import { z } from "zod";

export const variantSchema = z.object({
  size: z.string().min(1, "Оберіть розмір"),
  price: z.coerce.number().positive("Ціна обов'язкова і має бути більшою за 0"),
});

export const accessorySchema = z.object({
  type: z.enum(["headband", "gloves", "bag", "choker"]),
  price: z.coerce.number().positive("Ціна обов'язкова і має бути більшою за 0"),
});

export const productSchema = z
  .object({
    category: z.enum(["dress", "couture"]),
    name_uk: z.string().default(""),
    name_en: z.string().default(""),
    description_uk: z.string().default(""),
    description_en: z.string().default(""),
    images: z.array(z.string().url()).default([]),
    colors: z.array(z.string()).default([]),
    inStock: z.boolean().default(true),
    isNew: z.boolean().default(false),
    isBestseller: z.boolean().default(false),
    variants: z.array(variantSchema).min(1, "Додайте хоча б один варіант"),
    accessories: z.array(accessorySchema).max(4).default([]),
  })
  .refine(
    (data) => new Set(data.accessories.map((a) => a.type)).size === data.accessories.length,
    { message: "Кожен тип аксесуара можна додати лише один раз", path: ["accessories"] },
  );

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type AccessoryInput = z.infer<typeof accessorySchema>;
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
node --test lib/validation/product.test.ts
```

Expected: `# pass 9`, `# fail 0`.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: same or fewer errors than Task 2 Step 6 — `lib/validation/product.ts` itself now typechecks; remaining errors should only be in `lib/products.ts` (fixed in Task 4) and files consuming `ProductInput` without an `accessories` default (fixed in Tasks 6–7).

- [ ] **Step 6: Commit**

```bash
git add lib/validation/product.ts lib/validation/product.test.ts
git commit -m "feat: validate product accessories (fixed types, unique, positive price)"
```

---

### Task 4: `lib/products.ts` — map accessories from Prisma

**Files:**
- Modify: `lib/products.ts`

**Interfaces:**
- Consumes: `ProductAccessory` type from `lib/catalog.ts` (Task 2), `prisma.product` with a new `accessories` relation (Task 1).
- Produces: `getProductsByCategory` and `getProductBySlug` now return `Product.accessories` populated.

- [ ] **Step 1: Update `lib/products.ts`**

Replace the full file with:

```ts
// Server-only: Prisma-backed product queries.
// Do NOT import this from client components — use lib/catalog.ts for types/helpers.

import { prisma } from '@/lib/prisma';
import type { Product, ProductVariant, ProductAccessory, ProductCategory } from '@/lib/catalog';

function mapVariant(v: {
  id: string;
  size: string;
  price: { toNumber(): number } | number | string;
}): ProductVariant {
  return {
    id: v.id,
    size: v.size,
    price: typeof v.price === 'object' && 'toNumber' in v.price
      ? v.price.toNumber()
      : Number(v.price),
  };
}

function mapAccessory(a: {
  id: string;
  type: string;
  price: { toNumber(): number } | number | string;
}): ProductAccessory {
  return {
    id: a.id,
    type: a.type,
    price: typeof a.price === 'object' && 'toNumber' in a.price
      ? a.price.toNumber()
      : Number(a.price),
  };
}

function mapProduct(p: {
  id: string;
  slug: string;
  category: ProductCategory;
  name_uk: string;
  name_en: string;
  description_uk: string;
  description_en: string;
  images: string[];
  colors: string[];
  inStock: boolean;
  isNew: boolean;
  isBestseller: boolean;
  variants: Parameters<typeof mapVariant>[0][];
  accessories: Parameters<typeof mapAccessory>[0][];
}): Product {
  return {
    id: p.id,
    slug: p.slug,
    category: p.category,
    name_uk: p.name_uk,
    name_en: p.name_en,
    description_uk: p.description_uk,
    description_en: p.description_en,
    images: p.images,
    colors: p.colors,
    inStock: p.inStock,
    isNew: p.isNew,
    isBestseller: p.isBestseller,
    variants: p.variants.map(mapVariant),
    accessories: p.accessories.map(mapAccessory),
  };
}

export async function getProductsByCategory(
  category: ProductCategory,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { category, isHidden: false },
    orderBy: { createdAt: 'desc' },
    include: { variants: { orderBy: { price: 'asc' } }, accessories: true },
  });
  return rows.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { slug, isHidden: false },
    include: { variants: { orderBy: { price: 'asc' } }, accessories: true },
  });
  return row ? mapProduct(row) : null;
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no more errors originating from `lib/products.ts`. Remaining errors (if any) should only be in admin form files, fixed in Tasks 5–7.

- [ ] **Step 3: Commit**

```bash
git add lib/products.ts
git commit -m "feat: fetch product accessories in catalog queries"
```

---

### Task 5: `app/admin/products/actions.ts` — persist accessories

**Files:**
- Modify: `app/admin/products/actions.ts`

**Interfaces:**
- Consumes: `ProductInput.accessories` (Task 3), `prisma.productAccessory` (Task 1).
- Produces: `getProductAction` now includes `accessories`; `createProductAction`/`updateProductAction` persist them.

- [ ] **Step 1: Update `getProductAction`**

Find:

```ts
export async function getProductAction(id: string) {
  await requireAdmin();
  return prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
}
```

Change to:

```ts
export async function getProductAction(id: string) {
  await requireAdmin();
  return prisma.product.findUnique({
    where: { id },
    include: { variants: true, accessories: true },
  });
}
```

- [ ] **Step 2: Persist accessories on create**

In `createProductAction`, find:

```ts
        images: data.images,
        colors: data.colors,
        // "In stock" is no longer a concept admins manage — every product is
        // treated as in stock. Force true so stale data (or historic rows)
        // never disables purchasing.
        inStock: true,
        isNew: data.isNew,
        isBestseller: data.isBestseller,
        isHidden: false,
        variants: {
          create: data.variants.map((v) => ({
            size: v.size,
            price: v.price,
            images: [],
          })),
        },
      },
    });
```

Change to:

```ts
        images: data.images,
        colors: data.colors,
        // "In stock" is no longer a concept admins manage — every product is
        // treated as in stock. Force true so stale data (or historic rows)
        // never disables purchasing.
        inStock: true,
        isNew: data.isNew,
        isBestseller: data.isBestseller,
        isHidden: false,
        variants: {
          create: data.variants.map((v) => ({
            size: v.size,
            price: v.price,
            images: [],
          })),
        },
        accessories: {
          create: data.accessories.map((a) => ({
            type: a.type,
            price: a.price,
          })),
        },
      },
    });
```

- [ ] **Step 3: Replace accessories wholesale on update**

In `updateProductAction`, find:

```ts
  try {
    await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          category: data.category,
          name_uk: data.name_uk,
          name_en: data.name_en,
          description_uk: data.description_uk,
          description_en: data.description_en,
          images: data.images,
          colors: data.colors,
          inStock: true,
          isNew: data.isNew,
          isBestseller: data.isBestseller,
          variants: {
            create: data.variants.map((v) => ({
              size: v.size,
              price: v.price,
              images: [],
            })),
          },
        },
      }),
    ]);
  } catch {
```

Change to:

```ts
  try {
    await prisma.$transaction([
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.productAccessory.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          category: data.category,
          name_uk: data.name_uk,
          name_en: data.name_en,
          description_uk: data.description_uk,
          description_en: data.description_en,
          images: data.images,
          colors: data.colors,
          inStock: true,
          isNew: data.isNew,
          isBestseller: data.isBestseller,
          variants: {
            create: data.variants.map((v) => ({
              size: v.size,
              price: v.price,
              images: [],
            })),
          },
          accessories: {
            create: data.accessories.map((a) => ({
              type: a.type,
              price: a.price,
            })),
          },
        },
      }),
    ]);
  } catch {
```

This mirrors the existing "replace variants wholesale" pattern exactly (delete-then-recreate inside the same transaction), so it inherits the same correctness guarantees already relied on for variants.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors in `app/admin/products/actions.ts`.

- [ ] **Step 5: Commit**

```bash
git add app/admin/products/actions.ts
git commit -m "feat: persist product accessories in admin create/update actions"
```

---

### Task 6: Admin form default values — new/edit product pages

**Files:**
- Modify: `components/admin/NewProductForm.tsx`
- Modify: `app/admin/products/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `ProductInput.accessories` (Task 3), `getProductAction`'s now-populated `accessories` (Task 5).
- Produces: both admin form entry points supply a valid `accessories` default so `ProductForm` (Task 7) never receives `undefined`.

- [ ] **Step 1: Update `NewProductForm.tsx`**

Find:

```ts
const EMPTY: ProductInput = {
  category: "dress",
  name_uk: "",
  name_en: "",
  description_uk: "",
  description_en: "",
  images: [],
  colors: [],
  inStock: true, // no longer editable — actions.ts forces this true on save
  isNew: false,
  isBestseller: false,
  variants: [{ size: "86-92", price: undefined as unknown as number }],
};
```

Change to:

```ts
const EMPTY: ProductInput = {
  category: "dress",
  name_uk: "",
  name_en: "",
  description_uk: "",
  description_en: "",
  images: [],
  colors: [],
  inStock: true, // no longer editable — actions.ts forces this true on save
  isNew: false,
  isBestseller: false,
  variants: [{ size: "86-92", price: undefined as unknown as number }],
  accessories: [],
};
```

- [ ] **Step 2: Update `app/admin/products/[id]/edit/page.tsx`**

Find:

```ts
  const defaultValues: ProductInput = {
    category: product.category as "dress" | "couture",
    name_uk: product.name_uk,
    name_en: product.name_en,
    description_uk: product.description_uk,
    description_en: product.description_en,
    images: product.images,
    colors: product.colors,
    inStock: product.inStock,
    isNew: product.isNew,
    isBestseller: product.isBestseller,
    variants: product.variants.map((v) => ({
      size: v.size,
      price: Number(v.price),
    })),
  };
```

Change to:

```ts
  const defaultValues: ProductInput = {
    category: product.category as "dress" | "couture",
    name_uk: product.name_uk,
    name_en: product.name_en,
    description_uk: product.description_uk,
    description_en: product.description_en,
    images: product.images,
    colors: product.colors,
    inStock: product.inStock,
    isNew: product.isNew,
    isBestseller: product.isBestseller,
    variants: product.variants.map((v) => ({
      size: v.size,
      price: Number(v.price),
    })),
    accessories: product.accessories.map((a) => ({
      type: a.type as "headband" | "gloves" | "bag" | "choker",
      price: Number(a.price),
    })),
  };
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors in these two files.

- [ ] **Step 4: Commit**

```bash
git add components/admin/NewProductForm.tsx "app/admin/products/[id]/edit/page.tsx"
git commit -m "feat: wire accessory defaults into admin new/edit product forms"
```

---

### Task 7: `components/admin/ProductForm.tsx` — Accessories UI section

**Files:**
- Modify: `components/admin/ProductForm.tsx`

**Interfaces:**
- Consumes: `ACCESSORY_TYPES` (Task 2), `productSchema`'s `accessories` field (Task 3).
- Produces: a working "+ Додати аксесуар" section, same interaction pattern as the existing "Варіанти" section.

- [ ] **Step 1: Import `ACCESSORY_TYPES` and `useWatch`**

Find:

```ts
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { productSchema, type ProductInput } from "@/lib/validation/product";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { SIZES, COLORS } from "@/lib/catalog";
```

Change to:

```ts
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { productSchema, type ProductInput } from "@/lib/validation/product";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { SIZES, COLORS, ACCESSORY_TYPES } from "@/lib/catalog";
```

- [ ] **Step 2: Register the `accessories` field array and watch it**

Find:

```ts
  const variants = useFieldArray({ control, name: "variants" });
```

Change to:

```ts
  const variants = useFieldArray({ control, name: "variants" });
  const accessories = useFieldArray({ control, name: "accessories" });
  const watchedAccessories = useWatch({ control, name: "accessories" }) ?? [];
  const availableAccessoryTypes = ACCESSORY_TYPES.filter(
    (t) => !watchedAccessories.some((a) => a?.type === t.id),
  );
```

- [ ] **Step 3: Add the Accessories section**

Find the closing of the "Варіанти" section:

```tsx
        <div className="space-y-3">
          {variants.fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <select {...register(`variants.${i}.size`)} className={inputCls}>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Ціна, ₴"
                {...register(`variants.${i}.price`)}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => variants.remove(i)}
                className="rounded-full px-4 py-3 text-sm text-[#9b4a4a] transition-all duration-300 ease-in-out hover:bg-[#F4C6C6]/30"
              >
                Видалити
              </button>
            </div>
          ))}
        </div>
      </section>

      {serverError && (
```

Change to:

```tsx
        <div className="space-y-3">
          {variants.fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <select {...register(`variants.${i}.size`)} className={inputCls}>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Ціна, ₴"
                {...register(`variants.${i}.price`)}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => variants.remove(i)}
                className="rounded-full px-4 py-3 text-sm text-[#9b4a4a] transition-all duration-300 ease-in-out hover:bg-[#F4C6C6]/30"
              >
                Видалити
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <label className={labelCls}>Аксесуари</label>
          <select
            value=""
            disabled={availableAccessoryTypes.length === 0}
            onChange={(e) => {
              const type = e.target.value as (typeof ACCESSORY_TYPES)[number]["id"] | "";
              if (!type) return;
              accessories.append({ type, price: undefined as unknown as number });
            }}
            className="rounded-full bg-[#FDF8F4] px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-[#EDE0D4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              + Додати аксесуар
            </option>
            {availableAccessoryTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name_uk}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {accessories.fields.map((f, i) => {
            const typeLabel = ACCESSORY_TYPES.find((t) => t.id === f.type)?.name_uk ?? f.type;
            return (
              <div key={f.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                {/* `type` has no visible input (it's a read-only label below) —
                    register it as hidden so react-hook-form actually includes
                    it in the submitted data. Without this, only registered
                    leaf inputs are guaranteed to survive submission. */}
                <input type="hidden" {...register(`accessories.${i}.type`)} />
                <span className={`${inputCls} flex items-center bg-[#FDF8F4]`}>{typeLabel}</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ціна, ₴"
                  {...register(`accessories.${i}.price`)}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => accessories.remove(i)}
                  className="rounded-full px-4 py-3 text-sm text-[#9b4a4a] transition-all duration-300 ease-in-out hover:bg-[#F4C6C6]/30"
                >
                  Видалити
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {serverError && (
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors in `components/admin/ProductForm.tsx`.

- [ ] **Step 5: Manual check — start the app and exercise the form**

```bash
docker ps --filter "name=kiddie_chic_db" --format "{{.Names}} {{.Status}}"
npm run dev
```

In a browser, log into `/admin` and open `/admin/products/new`:
- Click "+ Додати аксесуар" → pick "Обруч" → a row appears with a price input.
- Reopen the dropdown → "Обруч" no longer listed (only the remaining 3 types).
- Add all 4 types → dropdown becomes disabled (all attached).
- Click "Видалити" on one row → it disappears and reappears in the dropdown.
- Fill required fields, set a price for each remaining accessory, submit → redirects to `/admin/products` without error.
- Open that product's edit page → the accessories you added are pre-filled with the correct type and price.

Stop the dev server (`Ctrl+C`) when done.

- [ ] **Step 6: Commit**

```bash
git add components/admin/ProductForm.tsx
git commit -m "feat: add accessories section to admin product form"
```

---

### Task 8: `lib/stores/cart.ts` — discriminated `CartItem`

**Files:**
- Modify: `lib/stores/cart.ts`
- Create: `lib/stores/cart.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `CartItem` (union of `{ kind: 'product'; ... }` and `{ kind: 'accessory'; ... }`), `cartItemKey(item: CartItem): string`, and updated `removeItem(key: string)` / `updateQty(key: string, qty: number)` signatures (previously `(productId, variantId)`/`(productId, variantId, qty)`) — Tasks 9 and 10 depend on these exact names and signatures.

- [ ] **Step 1: Write the failing test**

Create `lib/stores/cart.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { cartItemKey, type CartItem } from "./cart.ts";

test("cartItemKey distinguishes product items by productId+variantId", () => {
  const a: CartItem = {
    kind: "product",
    productId: "p1",
    variantId: "v1",
    name: "Сукня",
    size: "86-92",
    color: null,
    price: 1200,
    qty: 1,
    imageUrl: null,
  };
  const b: CartItem = { ...a, variantId: "v2" };
  assert.notEqual(cartItemKey(a), cartItemKey(b));
});

test("cartItemKey is stable for the same product+variant", () => {
  const a: CartItem = {
    kind: "product",
    productId: "p1",
    variantId: "v1",
    name: "Сукня",
    size: "86-92",
    color: null,
    price: 1200,
    qty: 1,
    imageUrl: null,
  };
  const b: CartItem = { ...a, qty: 3 };
  assert.equal(cartItemKey(a), cartItemKey(b));
});

test("cartItemKey distinguishes accessory items by accessoryId", () => {
  const a: CartItem = { kind: "accessory", accessoryId: "acc1", name: "Обруч", price: 150, qty: 1 };
  const b: CartItem = { ...a, accessoryId: "acc2" };
  assert.notEqual(cartItemKey(a), cartItemKey(b));
});

test("cartItemKey never collides a product item with an accessory item", () => {
  const product: CartItem = {
    kind: "product",
    productId: "acc1",
    variantId: "v1",
    name: "Сукня",
    size: null,
    color: null,
    price: 1200,
    qty: 1,
    imageUrl: null,
  };
  const accessory: CartItem = { kind: "accessory", accessoryId: "acc1", name: "Обруч", price: 150, qty: 1 };
  assert.notEqual(cartItemKey(product), cartItemKey(accessory));
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test lib/stores/cart.test.ts
```

Expected: FAIL — `cartItemKey` is not exported yet, and `CartItem` has no `kind` field.

- [ ] **Step 3: Rewrite `lib/stores/cart.ts`**

Replace the full file with:

```ts
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
      accessoryId: string;
      name: string;
      price: number;
      qty: number;
    };

export function cartItemKey(item: CartItem): string {
  return item.kind === "product"
    ? `product:${item.productId}:${item.variantId}`
    : `accessory:${item.accessoryId}`;
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
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Carts persisted before this change have items with no `kind` field —
      // stamp them as "product" (the only kind that existed back then) so
      // returning shoppers don't lose their cart or crash the page.
      migrate: (persisted) => {
        const state = persisted as { items?: Array<Record<string, unknown>> } | undefined;
        if (!state?.items) return { items: [] };
        return {
          items: state.items.map((i) => (i.kind ? i : { ...i, kind: "product" })),
        };
      },
    }
  )
);
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test lib/stores/cart.test.ts
```

Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Expected: errors now appear in `components/features/cart/CartView.tsx` and `components/features/catalog/ProductDetail.tsx` (both still call the old `removeItem(productId, variantId)`/`updateQty(productId, variantId, qty)` signatures and construct `CartItem` without `kind`). This is expected — Tasks 9 and 10 fix them.

- [ ] **Step 6: Commit**

```bash
git add lib/stores/cart.ts lib/stores/cart.test.ts
git commit -m "feat: make CartItem a discriminated union to support accessory line items"
```

---

### Task 9: `components/features/cart/CartView.tsx` — render accessory lines

**Files:**
- Modify: `components/features/cart/CartView.tsx`

**Interfaces:**
- Consumes: `cartItemKey`, updated `removeItem`/`updateQty` signatures (Task 8).
- Produces: cart page renders both dress and accessory line items correctly.

- [ ] **Step 1: Import `cartItemKey`**

Find:

```ts
import { useCartStore, type CartItem } from '@/lib/stores/cart';
```

Change to:

```ts
import { useCartStore, cartItemKey, type CartItem } from '@/lib/stores/cart';
```

- [ ] **Step 2: Fix `handleRemove` to use the new key-based API**

Find:

```ts
  function handleRemove(item: CartItem) {
    removeItem(item.productId, item.variantId);
    setUndoItem(item);
  }
```

Change to:

```ts
  function handleRemove(item: CartItem) {
    removeItem(cartItemKey(item));
    setUndoItem(item);
  }
```

- [ ] **Step 3: Fix the list key and gate product-only fields**

Find:

```tsx
              items.map((item) => (
                <motion.li
                  key={`${item.productId}:${item.variantId ?? 'na'}`}
                  layout
```

Change to:

```tsx
              items.map((item) => (
                <motion.li
                  key={cartItemKey(item)}
                  layout
```

- [ ] **Step 4: Gate the image block to product items only**

Find:

```tsx
                    <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-2xl bg-beige-100 md:w-32">
                      {item.imageUrl ? (
                        <Image
                          src={asset(item.imageUrl)}
                          alt={item.name}
                          fill
                          sizes="(min-width: 768px) 128px, 80px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
```

Change to:

```tsx
                    <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-2xl bg-beige-100 md:w-32">
                      {item.kind === 'product' && item.imageUrl ? (
                        <Image
                          src={asset(item.imageUrl)}
                          alt={item.name}
                          fill
                          sizes="(min-width: 768px) 128px, 80px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
```

- [ ] **Step 5: Gate the size/color attribute list to product items only**

Find:

```tsx
                      {/* Attributes */}
                      <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-foreground/65 md:mt-1.5 md:text-[13px]">
                        {item.size && (
                          <div>
                            <dt className="inline text-foreground/55">{t('size')}: </dt>
                            <dd className="inline text-foreground/80">{item.size}</dd>
                          </div>
                        )}
                        {item.color && (
                          <div>
                            <dt className="inline text-foreground/55">{t('color')}: </dt>
                            <dd className="inline text-foreground/80">{colorName(item.color, en)}</dd>
                          </div>
                        )}
                      </dl>
```

Change to:

```tsx
                      {/* Attributes */}
                      {item.kind === 'product' && (item.size || item.color) && (
                        <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-foreground/65 md:mt-1.5 md:text-[13px]">
                          {item.size && (
                            <div>
                              <dt className="inline text-foreground/55">{t('size')}: </dt>
                              <dd className="inline text-foreground/80">{item.size}</dd>
                            </div>
                          )}
                          {item.color && (
                            <div>
                              <dt className="inline text-foreground/55">{t('color')}: </dt>
                              <dd className="inline text-foreground/80">{colorName(item.color, en)}</dd>
                            </div>
                          )}
                        </dl>
                      )}
```

- [ ] **Step 6: Fix the qty +/- buttons to use the key-based API**

Find:

```tsx
                          <button
                            type="button"
                            aria-label={t('decreaseQty')}
                            onClick={() => updateQty(item.productId, item.variantId, item.qty - 1)}
```

Change to:

```tsx
                          <button
                            type="button"
                            aria-label={t('decreaseQty')}
                            onClick={() => updateQty(cartItemKey(item), item.qty - 1)}
```

Find:

```tsx
                          <button
                            type="button"
                            aria-label={t('increaseQty')}
                            onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)}
```

Change to:

```tsx
                          <button
                            type="button"
                            aria-label={t('increaseQty')}
                            onClick={() => updateQty(cartItemKey(item), item.qty + 1)}
```

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```

Expected: no more errors in `components/features/cart/CartView.tsx`.

- [ ] **Step 8: Commit**

```bash
git add components/features/cart/CartView.tsx
git commit -m "fix: cart view supports accessory line items via cartItemKey"
```

---

### Task 10: `components/features/catalog/ProductDetail.tsx` — Accessories block

**Files:**
- Modify: `components/features/catalog/ProductDetail.tsx`
- Modify: `messages/uk.json`
- Modify: `messages/en.json`

**Interfaces:**
- Consumes: `accessoryTypeName` (Task 2), `product.accessories` (Task 4), `CartItem` with `kind` (Task 8).
- Produces: the product page shows an "Аксесуари" block under "Купити" for dresses that have any, each addable to the cart.

- [ ] **Step 1: Add the new i18n keys**

In `messages/uk.json`, find (inside `"product": { ... }`):

```json
    "decreaseQty": "Зменшити кількість",
    "increaseQty": "Збільшити кількість"
  },
```

Change to:

```json
    "decreaseQty": "Зменшити кількість",
    "increaseQty": "Збільшити кількість",
    "accessoriesTitle": "Аксесуари",
    "addAccessory": "Додати {name} до кошика"
  },
```

In `messages/en.json`, find (inside `"product": { ... }`):

```json
    "decreaseQty": "Decrease quantity",
    "increaseQty": "Increase quantity"
  },
```

Change to:

```json
    "decreaseQty": "Decrease quantity",
    "increaseQty": "Increase quantity",
    "accessoriesTitle": "Accessories",
    "addAccessory": "Add {name} to cart"
  },
```

- [ ] **Step 2: Import `accessoryTypeName` and tag the existing `addItem` call with `kind`**

Find:

```ts
import { colorName, colorSwatch, swatchBackground, cover, type Product } from '@/lib/catalog';
```

Change to:

```ts
import { colorName, colorSwatch, swatchBackground, accessoryTypeName, cover, type Product } from '@/lib/catalog';
```

Find:

```ts
  function handleAdd() {
    if (!variant) return;
    addItem({
      productId: product.id,
      variantId: variant.id,
      name,
      size: variant.size,
      color: color || null,
      price: variant.price,
      qty,
      imageUrl: cover(product),
    });
    setAddedTick((n) => n + 1);
  }
```

Change to:

```ts
  function handleAdd() {
    if (!variant) return;
    addItem({
      kind: 'product',
      productId: product.id,
      variantId: variant.id,
      name,
      size: variant.size,
      color: color || null,
      price: variant.price,
      qty,
      imageUrl: cover(product),
    });
    setAddedTick((n) => n + 1);
  }

  function handleAddAccessory(a: Product['accessories'][number]) {
    addItem({
      kind: 'accessory',
      accessoryId: a.id,
      name: accessoryTypeName(a.type, en),
      price: a.price,
      qty: 1,
    });
    setAddedTick((n) => n + 1);
  }
```

- [ ] **Step 3: Insert the Accessories block after "Quantity + add to cart"**

Find:

```tsx
          <button
            type="button"
            onClick={handleAdd}
            disabled={!variant}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-powder-200 px-6 font-sans text-base font-semibold text-foreground/85 shadow-card transition-all hover:bg-powder-300 hover:text-foreground hover:shadow-float disabled:pointer-events-none disabled:opacity-40"
          >
            {added ? <Check size={18} /> : <ShoppingBag size={17} />}
            {t('addToCart')}
          </button>
        </div>

        {/* Secondary CTAs */}
```

Change to:

```tsx
          <button
            type="button"
            onClick={handleAdd}
            disabled={!variant}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-powder-200 px-6 font-sans text-base font-semibold text-foreground/85 shadow-card transition-all hover:bg-powder-300 hover:text-foreground hover:shadow-float disabled:pointer-events-none disabled:opacity-40"
          >
            {added ? <Check size={18} /> : <ShoppingBag size={17} />}
            {t('addToCart')}
          </button>
        </div>

        {/* Accessories */}
        {product.accessories.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-foreground/60">
              {t('accessoriesTitle')}
            </h3>
            <div className="space-y-2">
              {product.accessories.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-card"
                >
                  <span className="font-sans text-sm font-medium text-foreground/80">
                    {accessoryTypeName(a.type, en)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-sm font-bold text-gold">
                      {a.price.toLocaleString('uk-UA')} ₴
                    </span>
                    <button
                      type="button"
                      aria-label={t('addAccessory', { name: accessoryTypeName(a.type, en) })}
                      onClick={() => handleAddAccessory(a)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-powder-200 text-foreground/80 transition-all duration-300 ease-in-out hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secondary CTAs */}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no more errors in `components/features/catalog/ProductDetail.tsx`. Run the full check to confirm the whole project is clean now:

```bash
npm run typecheck
```

Expected: exits with no output (success).

- [ ] **Step 5: Commit**

```bash
git add components/features/catalog/ProductDetail.tsx messages/uk.json messages/en.json
git commit -m "feat: show attachable accessories on the product page"
```

---

### Task 11: Checkout — resolve and persist accessory line items

**Files:**
- Modify: `app/[locale]/(checkout)/checkout/actions.ts`

**Interfaces:**
- Consumes: `CartItem` union (Task 8), `prisma.productAccessory` (Task 1), `sendNewOrderNotification` (existing, unchanged signature).
- Produces: `placeOrder` accepts carts containing accessory lines, prices them from the DB, and persists them as `OrderAccessoryItem` rows.

- [ ] **Step 1: Replace the full file**

Replace `app/[locale]/(checkout)/checkout/actions.ts` with:

```ts
'use server';

import { prisma } from '@/lib/prisma';
import { sendNewOrderNotification } from '@/lib/telegram';
import type { CartItem } from '@/lib/stores/cart';

export interface PlaceOrderPayload {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  novaPoshta: string;
  note: string;
  paymentMethod: 'cod' | 'card';
  items: CartItem[];
}

export type PlaceOrderResult =
  | { orderId: string; ref: string }
  | { error: string };

function isValidPhone(p: string): boolean {
  return /^\+380\d{9}$/.test(p.replace(/\s/g, ''));
}

function generateRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `KC-${timestamp}${random}`;
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResult> {
  // ── Validate input ───────────────────────────────────────────────────────────
  if (!payload.firstName.trim()) return { error: "Вкажіть ім'я" };
  if (!isValidPhone(payload.phone)) return { error: 'Невірний номер телефону' };
  if (!payload.city.trim()) return { error: 'Вкажіть місто' };
  if (!payload.novaPoshta.trim()) return { error: 'Вкажіть відділення' };
  if (!payload.items.length) return { error: 'Кошик порожній' };

  const productLines = payload.items.filter(
    (i): i is Extract<CartItem, { kind: 'product' }> => i.kind === 'product',
  );
  const accessoryLines = payload.items.filter(
    (i): i is Extract<CartItem, { kind: 'accessory' }> => i.kind === 'accessory',
  );

  // ── Fetch authoritative prices from DB (never trust client prices) ───────────
  const variantIds = productLines.map((i) => i.variantId);
  const productIds = productLines.map((i) => i.productId);
  const accessoryIds = accessoryLines.map((i) => i.accessoryId);

  let variants: { id: string; price: { toNumber: () => number } | number }[];
  let products: { id: string }[];
  let accessories: { id: string; price: { toNumber: () => number } | number }[];
  try {
    [variants, products, accessories] = await Promise.all([
      variantIds.length > 0
        ? prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, price: true },
          })
        : Promise.resolve([]),
      productIds.length > 0
        ? prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true },
          })
        : Promise.resolve([]),
      accessoryIds.length > 0
        ? prisma.productAccessory.findMany({
            where: { id: { in: accessoryIds } },
            select: { id: true, price: true },
          })
        : Promise.resolve([]),
    ]);
  } catch (err) {
    console.error('[placeOrder] DB lookup error', err);
    return { error: 'Помилка збереження замовлення. Спробуйте ще раз.' };
  }

  const variantPriceMap = new Map(
    variants.map((v) => [
      v.id,
      typeof v.price === 'number' ? v.price : v.price.toNumber(),
    ]),
  );
  const productIdSet = new Set(products.map((p) => p.id));
  const accessoryPriceMap = new Map(
    accessories.map((a) => [
      a.id,
      typeof a.price === 'number' ? a.price : a.price.toNumber(),
    ]),
  );

  let resolvedProductItems: (Extract<CartItem, { kind: 'product' }> & { price: number })[];
  let resolvedAccessoryItems: { name: string; price: number; qty: number }[];
  try {
    resolvedProductItems = productLines.map((i) => {
      if (!productIdSet.has(i.productId)) {
        throw new Error(`Product ${i.productId} not found`);
      }
      const price = variantPriceMap.get(i.variantId);
      if (price === undefined) {
        throw new Error(`Variant ${i.variantId} not found`);
      }
      if (!Number.isInteger(i.qty) || i.qty < 1 || i.qty > 99) {
        throw new Error(`Invalid qty ${i.qty}`);
      }
      return { ...i, price };
    });
    resolvedAccessoryItems = accessoryLines.map((i) => {
      const price = accessoryPriceMap.get(i.accessoryId);
      if (price === undefined) {
        throw new Error(`Accessory ${i.accessoryId} not found`);
      }
      if (!Number.isInteger(i.qty) || i.qty < 1 || i.qty > 99) {
        throw new Error(`Invalid qty ${i.qty}`);
      }
      return { name: i.name, price, qty: i.qty };
    });
  } catch {
    return { error: 'Товар не знайдено або недоступний' };
  }

  const totalAmount =
    resolvedProductItems.reduce((s, i) => s + i.price * i.qty, 0) +
    resolvedAccessoryItems.reduce((s, i) => s + i.price * i.qty, 0);
  const ref = generateRef();
  const customerName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();

  // ── Persist ──────────────────────────────────────────────────────────────────
  let order: { id: string; ref: string };
  try {
    order = await prisma.order.create({
      data: {
        ref,
        customerName,
        phone: payload.phone.replace(/\s/g, ''),
        email: '',
        city: payload.city,
        novaPoshta: payload.novaPoshta,
        note: payload.note.trim() || null,
        paymentMethod: payload.paymentMethod,
        totalAmount,
        items: {
          create: resolvedProductItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            size: i.size ?? undefined,
            color: i.color ?? undefined,
            price: i.price,
            qty: i.qty,
          })),
        },
        accessoryItems: {
          create: resolvedAccessoryItems.map((i) => ({
            name: i.name,
            price: i.price,
            qty: i.qty,
          })),
        },
      },
      select: { id: true, ref: true },
    });
  } catch (err) {
    console.error('[placeOrder] DB error', err);
    return { error: 'Помилка збереження замовлення. Спробуйте ще раз.' };
  }

  // ── Notify (fire-and-forget for COD) ────────────────────────────────────────
  if (payload.paymentMethod === 'cod') {
    void sendNewOrderNotification({
      ref: order.ref,
      customerName,
      phone: payload.phone.replace(/\s/g, ''),
      city: payload.city,
      novaPoshta: payload.novaPoshta,
      note: payload.note.trim() || null,
      totalAmount,
      paymentMethod: 'cod',
      monoPaidAt: null,
      items: [
        ...resolvedProductItems.map((i) => ({
          name: i.name,
          size: i.size,
          color: i.color,
          price: i.price,
          qty: i.qty,
        })),
        ...resolvedAccessoryItems.map((i) => ({
          name: i.name,
          size: null,
          color: null,
          price: i.price,
          qty: i.qty,
        })),
      ],
    }).catch((err) => console.error('[placeOrder] Telegram error', err));
  }

  return { orderId: order.id, ref: order.ref };
}
```

Note what changed vs. the pre-existing file: `variantId` is no longer nullable on `kind: 'product'` items (Task 8 made it a required `string`), so the old "has no variant" runtime check is gone — the type system now guarantees it. Everything else about the product-line resolution logic is unchanged; the accessory-line resolution mirrors it exactly.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors anywhere in the project.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/(checkout)/checkout/actions.ts"
git commit -m "feat: resolve and persist accessory line items at checkout"
```

---

### Task 12: End-to-end verification

**Files:** none (verification only).

**Interfaces:** N/A.

- [ ] **Step 1: Full lint + typecheck**

```bash
npm run lint && npm run typecheck
```

Expected: both exit clean.

- [ ] **Step 2: Full unit test run**

```bash
node --test lib/*.test.ts lib/validation/*.test.ts lib/stores/*.test.ts
```

Expected: all tests pass, `# fail 0`.

- [ ] **Step 3: Drive the real flow in a browser (per CLAUDE.md — lint/typecheck alone do not close out a UI feature)**

Invoke the `verify` skill (or manually, if unavailable):

1. Ensure `kiddie_chic_db` is up (`docker ps`), start `npm run dev`.
2. Admin: create a dress with 2 accessories (e.g. "Обруч" 150₴, "Чокер" 200₴) and at least one size variant. Save.
3. Storefront: open that dress's product page. Confirm the "Аксесуари" block appears under "Купити" with both accessories, correct prices, no photos.
4. Click "+" on "Обруч" → confirm the cart badge/count increases and the toast/redirect behavior matches the existing "added to cart" UX.
5. Click "+" on "Обруч" again → open `/cart` → confirm it's a single line with qty 2, not two separate lines.
6. Add the dress itself (pick a size, "Купити") → open `/cart` → confirm the dress and the accessory show as two independent lines, dress has image/size, accessory does not.
7. Remove the accessory line via the "×" button → confirm only that line disappears, the dress line is unaffected; use "Скасувати" (undo) → confirm it comes back.
8. Proceed to `/checkout`, fill the form, submit with COD → confirm success (order reference shown) and no server error.
9. In the DB, spot-check the order persisted both an `OrderItem` (dress) and an `OrderAccessoryItem` (Обруч) row:
   ```bash
   docker exec kiddie_chic_db psql -U kc_user -d kiddie_chic -c \
     "SELECT o.ref, oi.name AS product_item, oa.name AS accessory_item FROM \"Order\" o LEFT JOIN \"OrderItem\" oi ON oi.\"orderId\" = o.id LEFT JOIN \"OrderAccessoryItem\" oa ON oa.\"orderId\" = o.id ORDER BY o.\"createdAt\" DESC LIMIT 5;"
   ```
   Expected: the most recent order shows both rows.
10. Repeat step 3 on a dress with zero accessories → confirm the block doesn't render at all (no empty heading).
11. Stop the dev server.

Report PASS/FAIL with what was actually observed, per the `verify` skill's reporting format.

- [ ] **Step 4: Final commit (if verification uncovered fixups)**

If Step 3 required any code fixes, commit them with a message describing what was wrong (e.g. `fix: <specific bug found during accessories e2e verification>`). If no fixes were needed, this step is a no-op — nothing to commit.
