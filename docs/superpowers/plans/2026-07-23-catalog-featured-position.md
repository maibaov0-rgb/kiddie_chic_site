# Catalog Featured Position Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins pin specific products to explicit "top" positions (1–10) within their category, so they show first on the public catalog, while everything else keeps sorting by creation date as it does today.

**Architecture:** One new nullable `featuredPosition` column on `Product`. A pure, fully-unit-tested function (`computeFeaturedReorder`) owns all the reordering math (insert/move/remove/evict-at-cap) against an in-memory list; a thin Prisma wrapper (`applyFeaturedPosition`) reads the current rows for a category, calls the pure function, and writes only the rows that changed, inside the same transaction as the product create/update/delete. The admin form gets a checkbox + position `<select>`; the public catalog query adds `featuredPosition` as the primary sort key (nulls last), only for the "default" sort option — price sorts are untouched.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Prisma v7 (`@/app/generated/prisma`), Zod v4, react-hook-form, `node:test` (existing convention: `*.test.ts` run via `node --test <file>`).

## Global Constraints

- TS strict, no `any` (project-wide rule).
- All admin-facing labels/messages in this feature are Ukrainian-only strings (matches existing admin UI — it is not run through `next-intl`).
- Featured cap is a **hard 10 per category**; category scope is `dress` and `couture` only (`accessory` is not a selectable category — see `productSchema`).
- Must not change `sortProducts`/`price-asc`/`price-desc` behavior (spec: featured order only applies to `default` sort).
- Run `npm run lint && npm run typecheck` before considering any task done; this plan also calls it out per-task where relevant.
- Spec of record: `docs/superpowers/specs/2026-07-23-catalog-featured-position-design.md`.

---

### Task 1: Prisma schema — add `featuredPosition`

**Files:**
- Modify: `prisma/schema.prisma:116-143` (`model Product`)

**Interfaces:**
- Produces: `Product.featuredPosition: Int | null` on the generated Prisma client, consumed by every later task.

- [ ] **Step 1: Add the field and index**

In `prisma/schema.prisma`, inside `model Product`, add the field next to the other flags and a new compound index:

```prisma
model Product {
  id             String          @id @default(cuid())
  slug           String          @unique
  category       ProductCategory

  name_uk        String
  name_en        String
  description_uk String          @db.Text
  description_en String          @db.Text

  images       String[]
  colors       String[]

  inStock      Boolean @default(true)
  isNew        Boolean @default(false)
  isBestseller Boolean @default(false)
  isHidden     Boolean @default(false)

  featuredPosition Int? // null = not featured; 1..10 = position within its category's top list

  variants    ProductVariant[]
  accessories ProductAccessory[]
  orderItems  OrderItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@index([slug])
  @@index([category, featuredPosition])
}
```

- [ ] **Step 2: Generate and apply the migration**

Run:
```bash
npx prisma migrate dev --name add_product_featured_position
```
Expected: prints `Applying migration ...add_product_featured_position` and finishes with "Your database is now in sync with your schema." A new folder appears under `prisma/migrations/` containing `migration.sql` with an `ALTER TABLE "Product" ADD COLUMN "featuredPosition" INTEGER;` and a `CREATE INDEX` statement. The Prisma client is regenerated automatically as part of this command.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: passes (no consumers of `featuredPosition` yet, so nothing should break).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add Product.featuredPosition for catalog top ordering"
```

---

### Task 2: Pure reorder logic (`lib/featured.ts`) — TDD

**Files:**
- Create: `lib/featured.ts`
- Create: `lib/featured.test.ts`

**Interfaces:**
- Produces: `FeaturedRow` type, `MAX_FEATURED_POSITION` constant, `computeFeaturedReorder(categoryRows: FeaturedRow[], targetId: string, requestedPosition: number | null): FeaturedRow[]` — consumed by Task 3's `applyFeaturedPosition`.
- `computeFeaturedReorder` returns only the rows whose `featuredPosition` value actually changes (a diff, not the full set).

- [ ] **Step 1: Write failing tests**

Create `lib/featured.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFeaturedReorder, MAX_FEATURED_POSITION } from "./featured.ts";

test("MAX_FEATURED_POSITION is 10", () => {
  assert.equal(MAX_FEATURED_POSITION, 10);
});

test("no-op: requesting the position the row already has", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
  ];
  const diff = computeFeaturedReorder(rows, "a", 1);
  assert.deepEqual(diff, []);
});

test("no-op: un-featuring a row that isn't featured", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: null },
  ];
  const diff = computeFeaturedReorder(rows, "b", null);
  assert.deepEqual(diff, []);
});

test("insert: new featured row at position 1 shifts existing rows down", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
    { id: "c", featuredPosition: 3 },
    { id: "d", featuredPosition: null },
  ];
  const diff = computeFeaturedReorder(rows, "d", 1);
  assert.deepEqual(
    diff.sort((x, y) => x.id.localeCompare(y.id)),
    [
      { id: "a", featuredPosition: 2 },
      { id: "b", featuredPosition: 3 },
      { id: "c", featuredPosition: 4 },
      { id: "d", featuredPosition: 1 },
    ],
  );
});

test("insert: new featured row appended at the end doesn't move anyone else", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
    { id: "c", featuredPosition: null },
  ];
  const diff = computeFeaturedReorder(rows, "c", 3);
  assert.deepEqual(diff, [{ id: "c", featuredPosition: 3 }]);
});

test("remove: un-featuring a middle row compresses the gap", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
    { id: "c", featuredPosition: 3 },
    { id: "d", featuredPosition: 4 },
  ];
  const diff = computeFeaturedReorder(rows, "b", null);
  assert.deepEqual(
    diff.sort((x, y) => x.id.localeCompare(y.id)),
    [
      { id: "b", featuredPosition: null },
      { id: "c", featuredPosition: 2 },
      { id: "d", featuredPosition: 3 },
    ],
  );
});

test("move: existing featured row moves from position 2 to 4 in a 4-item list", () => {
  const rows = [
    { id: "a", featuredPosition: 1 },
    { id: "b", featuredPosition: 2 },
    { id: "c", featuredPosition: 3 },
    { id: "d", featuredPosition: 4 },
  ];
  const diff = computeFeaturedReorder(rows, "b", 4);
  assert.deepEqual(
    diff.sort((x, y) => x.id.localeCompare(y.id)),
    [
      { id: "b", featuredPosition: 4 },
      { id: "c", featuredPosition: 2 },
      { id: "d", featuredPosition: 3 },
    ],
  );
});

test("cap: inserting an 11th featured row at position 1 evicts whoever falls to position 11", () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({
    id: `p${i + 1}`,
    featuredPosition: i + 1,
  }));
  rows.push({ id: "new", featuredPosition: null });
  const diff = computeFeaturedReorder(rows, "new", 1);
  const byId = new Map(diff.map((d) => [d.id, d.featuredPosition]));
  assert.equal(byId.get("new"), 1);
  assert.equal(byId.get("p1"), 2);
  assert.equal(byId.get("p9"), 10);
  assert.equal(byId.get("p10"), null); // evicted — fell off the end of the top 10
  assert.equal(diff.length, 10); // new + p1..p9 shift + p10 evicted
});

test("a product not present in categoryRows is treated as not featured", () => {
  const rows = [{ id: "a", featuredPosition: 1 }];
  const diff = computeFeaturedReorder(rows, "brand-new-id", 1);
  assert.deepEqual(diff.sort((x, y) => x.id.localeCompare(y.id)), [
    { id: "a", featuredPosition: 2 },
    { id: "brand-new-id", featuredPosition: 1 },
  ]);
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `node --test lib/featured.test.ts`
Expected: FAIL — `Cannot find module './featured.ts'` (file doesn't exist yet).

- [ ] **Step 3: Implement `lib/featured.ts`**

```ts
// Pure reordering logic for the catalog "featured position" (top 1..10 per
// category). No Prisma/DB import here on purpose — this file must stay
// trivially unit-testable. lib/products.ts wraps it with real reads/writes.

export interface FeaturedRow {
  id: string;
  featuredPosition: number | null;
}

export const MAX_FEATURED_POSITION = 10;

/**
 * Given every row in one category (only rows with a non-null
 * featuredPosition matter, but passing the rest is harmless), computes the
 * minimal set of rows whose featuredPosition must change to move `targetId`
 * to `requestedPosition` (or unset it, if `requestedPosition` is null).
 *
 * Contract: `categoryRows` is assumed to already satisfy the invariant that
 * featured rows occupy a contiguous 1..N range (true by construction, since
 * every write goes through this function). `targetId` does not need to be
 * present in `categoryRows` — a product not yet loaded (e.g. mid-create) is
 * treated as not featured.
 */
export function computeFeaturedReorder(
  categoryRows: FeaturedRow[],
  targetId: string,
  requestedPosition: number | null,
): FeaturedRow[] {
  const originalById = new Map(categoryRows.map((r) => [r.id, r.featuredPosition]));
  if (!originalById.has(targetId)) originalById.set(targetId, null);

  const others = categoryRows
    .filter((r) => r.id !== targetId && r.featuredPosition !== null)
    .sort((a, b) => (a.featuredPosition as number) - (b.featuredPosition as number));

  const orderedIds = others.map((r) => r.id);

  if (requestedPosition !== null) {
    const insertAt = Math.min(Math.max(requestedPosition, 1), orderedIds.length + 1) - 1;
    orderedIds.splice(insertAt, 0, targetId);
  }

  const finalIds = orderedIds.slice(0, MAX_FEATURED_POSITION);
  const evictedIds = orderedIds.slice(MAX_FEATURED_POSITION);

  const diff: FeaturedRow[] = [];

  finalIds.forEach((id, idx) => {
    const newPosition = idx + 1;
    if (originalById.get(id) !== newPosition) diff.push({ id, featuredPosition: newPosition });
  });

  evictedIds.forEach((id) => {
    if (originalById.get(id) !== null) diff.push({ id, featuredPosition: null });
  });

  // requestedPosition === null means "un-feature targetId": it was excluded
  // from `others` above, so if it isn't already null in the DB, emit it here.
  if (requestedPosition === null && originalById.get(targetId) !== null) {
    diff.push({ id: targetId, featuredPosition: null });
  }

  return diff;
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `node --test lib/featured.test.ts`
Expected: `# pass 10`, `# fail 0`.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add lib/featured.ts lib/featured.test.ts
git commit -m "feat: pure reorder logic for catalog featured position"
```

---

### Task 3: Prisma wrapper (`applyFeaturedPosition`)

**Files:**
- Modify: `lib/featured.ts` (add to the same file — it's one small, cohesive module)

**Interfaces:**
- Consumes: `computeFeaturedReorder` (Task 2), `Prisma.TransactionClient` type from `@/app/generated/prisma/client`.
- Produces: `applyFeaturedPosition(tx: Prisma.TransactionClient, params: { productId: string; category: "dress" | "couture"; requestedPosition: number | null }): Promise<void>` — consumed by Task 4 (`actions.ts`).

- [ ] **Step 1: Add the wrapper function**

Append to `lib/featured.ts`:

```ts
import type { Prisma } from "@/app/generated/prisma/client";

/**
 * Reads every product in `category`, computes the reorder diff, and writes
 * it. Must be called inside the same transaction as the product
 * create/update/delete that triggered it, so the two writes are atomic.
 */
export async function applyFeaturedPosition(
  tx: Prisma.TransactionClient,
  params: {
    productId: string;
    category: "dress" | "couture";
    requestedPosition: number | null;
  },
): Promise<void> {
  const rows = await tx.product.findMany({
    where: { category: params.category },
    select: { id: true, featuredPosition: true },
  });

  const diff = computeFeaturedReorder(rows, params.productId, params.requestedPosition);

  for (const change of diff) {
    await tx.product.update({
      where: { id: change.id },
      data: { featuredPosition: change.featuredPosition },
    });
  }
}
```

This isn't independently unit-testable without a real database (it's a thin I/O shell around the already-tested pure function) — it's exercised end-to-end in Task 7's manual verification.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes. If `Prisma.TransactionClient` isn't exported from `@/app/generated/prisma/client`, check `app/generated/prisma/internal/prismaNamespace.ts` for the exact export name (it is exported there as `TransactionClient` under the `Prisma` namespace as of this codebase's generator output).

- [ ] **Step 3: Commit**

```bash
git add lib/featured.ts
git commit -m "feat: wire featured-position reorder into a Prisma transaction helper"
```

---

### Task 4: Validation schema — add `featuredPosition`

**Files:**
- Modify: `lib/validation/product.ts:38-56`
- Modify: `lib/validation/product.test.ts`

**Interfaces:**
- Produces: `ProductInput.featuredPosition: number | null` — consumed by Task 5 (`actions.ts`), Task 6 (`ProductForm.tsx`), Task 7 (`NewProductForm.tsx`, edit page).

- [ ] **Step 1: Write failing tests**

Append to `lib/validation/product.test.ts`:

```ts
test("featuredPosition defaults to null", () => {
  const r = productSchema.safeParse(valid);
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.featuredPosition, null);
});

test("accepts featuredPosition 1..10", () => {
  const r = productSchema.safeParse({ ...valid, featuredPosition: 5 });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.featuredPosition, 5);
});

test("rejects featuredPosition 0", () => {
  const r = productSchema.safeParse({ ...valid, featuredPosition: 0 });
  assert.equal(r.success, false);
});

test("rejects featuredPosition 11", () => {
  const r = productSchema.safeParse({ ...valid, featuredPosition: 11 });
  assert.equal(r.success, false);
});

test("treats empty string featuredPosition (unset select) as null", () => {
  const r = productSchema.safeParse({ ...valid, featuredPosition: "" });
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.featuredPosition, null);
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `node --test lib/validation/product.test.ts`
Expected: FAIL — `featuredPosition` doesn't exist on the schema, `r.data.featuredPosition` is `undefined` not `null` / valid parse still succeeds but assertions on the value fail.

- [ ] **Step 3: Add the field to the schema**

In `lib/validation/product.ts`, add to `productSchema`'s object (after `isBestseller`):

```ts
    featuredPosition: z
      .preprocess(
        (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
        z.union([
          z.number().int().min(1, "Позиція від 1 до 10").max(10, "Позиція від 1 до 10"),
          z.null(),
        ]),
      )
      .default(null),
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `node --test lib/validation/product.test.ts`
Expected: all tests pass (existing 9 + 5 new = 14).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: fails at this point — `ProductInput` now requires `featuredPosition` wherever a `ProductInput` object literal is built (`NewProductForm.tsx`, edit page). That's expected; fixed in Task 7. Note it here and move on.

- [ ] **Step 6: Commit**

```bash
git add lib/validation/product.ts lib/validation/product.test.ts
git commit -m "feat(validation): add featuredPosition (1-10 or null) to productSchema"
```

---

### Task 5: Catalog domain type + query sort

**Files:**
- Modify: `lib/catalog.ts:190-205` (`Product` interface)
- Modify: `lib/products.ts:37-83` (`mapProduct`, `getProductsByCategory`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `Product.featuredPosition: number | null` on the shared catalog domain type — consumed by any component rendering `Product` (none need it yet; it flows through for future use, e.g. an admin badge already reads it straight off the Prisma row instead).

- [ ] **Step 1: Add the field to the domain type**

In `lib/catalog.ts`, add to the `Product` interface (`lib/catalog.ts:190-205`):

```ts
export interface Product {
  id: string;
  slug: string;
  category: ProductCategory;
  name_uk: string;
  name_en: string;
  description_uk: string;
  description_en: string;
  images: string[];
  colors: string[]; // ColorOption.id[]
  inStock: boolean;
  isNew: boolean;
  isBestseller: boolean;
  featuredPosition: number | null;
  variants: ProductVariant[]; // empty for couture
  accessories: ProductAccessory[]; // empty for couture and dresses with no accessories
}
```

- [ ] **Step 2: Update `mapProduct` and the category query**

In `lib/products.ts`, add `featuredPosition: number | null;` to `mapProduct`'s parameter type and pass it through in the returned object, and add it to the `orderBy` of `getProductsByCategory`:

```ts
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
  featuredPosition: number | null;
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
    featuredPosition: p.featuredPosition,
    variants: p.variants.map(mapVariant),
    accessories: p.accessories.map(mapAccessory),
  };
}

export async function getProductsByCategory(
  category: ProductCategory,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { category, isHidden: false },
    orderBy: [
      { featuredPosition: { sort: 'asc', nulls: 'last' } },
      { createdAt: 'desc' },
    ],
    include: { variants: { orderBy: { price: 'asc' } }, accessories: true },
  });
  return rows.map(mapProduct);
}
```

Do not touch `getProductBySlug` or `sortProducts` — a single product lookup has no ordering concept, and `sortProducts`'s `'default'` branch already passes the array through unchanged, which is exactly the behavior the spec calls for (featured order flows straight from `getProductsByCategory`; `price-asc`/`price-desc` fully override it).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: still fails on the same `ProductInput` literal sites as Task 4 (not yet fixed) — no new errors from this task's files.

- [ ] **Step 4: Commit**

```bash
git add lib/catalog.ts lib/products.ts
git commit -m "feat(catalog): sort products by featuredPosition ahead of createdAt"
```

---

### Task 6: Server actions — wire `applyFeaturedPosition` into create/update/delete

**Files:**
- Modify: `app/admin/products/actions.ts`

**Interfaces:**
- Consumes: `applyFeaturedPosition` (Task 3), `data.featuredPosition` from `ProductInput` (Task 4).
- Produces: no new exports — `createProductAction`, `updateProductAction`, `deleteProductAction` keep their existing signatures.

- [ ] **Step 1: Update `createProductAction`**

Replace the `try { ... }` block in `createProductAction` (`app/admin/products/actions.ts:67-113`) so the create and the featured-position insert happen in one transaction:

```ts
  try {
    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          slug,
          category: data.category,
          name_uk: data.name_uk,
          name_en: data.name_en,
          description_uk: data.description_uk,
          description_en: data.description_en,
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

      if (data.featuredPosition !== null) {
        await applyFeaturedPosition(tx, {
          productId: product.id,
          category: data.category,
          requestedPosition: data.featuredPosition,
        });
      }

      return product;
    });

    revalidatePath("/admin/products");
    revalidateCatalog();
    return { ok: true, id: created.id };
  } catch (error) {
    // Concurrent creates of the same name can race the slug @unique constraint.
    if (isPrismaErrorWithCode(error, "P2002")) {
      return {
        ok: false,
        error: "Товар із такою назвою вже існує. Змініть назву та спробуйте ще раз.",
      };
    }
    return { ok: false, error: "Не вдалося зберегти товар. Спробуйте ще раз." };
  }
```

- [ ] **Step 2: Update `updateProductAction`**

Replace the `try { ... }` block in `updateProductAction` (`app/admin/products/actions.ts:130-165`) with a callback-form transaction that reads the old category/position first, compresses the old category if the category changed, applies the main field update (without `featuredPosition`), then applies the featured-position reorder only when the category didn't change (a category change always resets featured status — see spec §5):

```ts
  try {
    await prisma.$transaction(async (tx) => {
      const old = await tx.product.findUniqueOrThrow({
        where: { id },
        select: { category: true, featuredPosition: true },
      });
      const categoryChanged = old.category !== data.category;

      if (categoryChanged && old.featuredPosition !== null) {
        await applyFeaturedPosition(tx, {
          productId: id,
          category: old.category,
          requestedPosition: null,
        });
      }

      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productAccessory.deleteMany({ where: { productId: id } });
      await tx.product.update({
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
      });

      if (categoryChanged) {
        // Category changed: featured status is intentionally reset, not
        // carried over — the position only ever made sense in the old
        // category's list. `old.featuredPosition` was already cleared above.
        if (old.featuredPosition !== null) {
          await tx.product.update({ where: { id }, data: { featuredPosition: null } });
        }
      } else {
        await applyFeaturedPosition(tx, {
          productId: id,
          category: data.category,
          requestedPosition: data.featuredPosition,
        });
      }
    });
  } catch {
    return { ok: false, error: "Не вдалося зберегти зміни. Спробуйте ще раз." };
  }
```

Note: the `applyFeaturedPosition(tx, { ..., requestedPosition: null })` call for `categoryChanged` already sets the product's own row to `null` as part of its diff (see `computeFeaturedReorder`'s "un-feature targetId" branch in Task 2) — the extra explicit `tx.product.update` guard above is redundant defense in case that code path is ever refactored to skip self-writes; keep it, it's one cheap no-op write.

- [ ] **Step 3: Update `deleteProductAction`**

Replace the body of `deleteProductAction` (`app/admin/products/actions.ts:173-203`) so the featured-position compression happens atomically with the delete:

```ts
export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id },
    select: { images: true, category: true, featuredPosition: true },
  });
  if (!product) return { ok: false, error: "Товар не знайдено" };

  // Best-effort image cleanup — never blocks DB delete.
  await Promise.allSettled(
    product.images.map((url) => {
      const pid = publicIdFromUrl(url);
      return pid ? deleteImage(pid) : Promise.resolve();
    }),
  );

  try {
    await prisma.$transaction(async (tx) => {
      if (product.featuredPosition !== null) {
        await applyFeaturedPosition(tx, {
          productId: id,
          category: product.category,
          requestedPosition: null,
        });
      }
      await tx.product.delete({ where: { id } }); // variants cascade
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2003")) {
      return {
        ok: false,
        error: "Неможливо видалити товар: є пов'язані замовлення.",
      };
    }
    return { ok: false, error: "Не вдалося видалити товар. Спробуйте ще раз." };
  }
  revalidatePath("/admin/products");
  revalidateCatalog();
  return { ok: true };
}
```

- [ ] **Step 4: Add the import**

At the top of `app/admin/products/actions.ts`, add:

```ts
import { applyFeaturedPosition } from "@/lib/featured";
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: still fails only on the pre-existing `ProductInput` literal sites (`NewProductForm.tsx`, edit page) — fixed next in Task 7. No errors from `actions.ts` itself.

- [ ] **Step 6: Commit**

```bash
git add app/admin/products/actions.ts
git commit -m "feat(admin): apply featured-position reorder on product create/update/delete"
```

---

### Task 7: Admin form UI — checkbox + position select

**Files:**
- Modify: `components/admin/ProductForm.tsx`
- Modify: `components/admin/NewProductForm.tsx`
- Modify: `app/admin/products/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `ProductInput.featuredPosition` (Task 4).
- Produces: nothing new — closes out the `ProductInput` literal type errors left open since Task 4.

- [ ] **Step 1: Add `featuredPosition: null` to the new-product defaults**

In `components/admin/NewProductForm.tsx`, add to the `EMPTY` object:

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
  featuredPosition: null,
  variants: [{ size: "86-92", price: undefined as unknown as number }],
  accessories: [],
};
```

- [ ] **Step 2: Map `featuredPosition` in the edit page**

In `app/admin/products/[id]/edit/page.tsx`, add to `defaultValues`:

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
    featuredPosition: product.featuredPosition,
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

Run: `npm run typecheck`
Expected: passes — this was the last remaining error from Task 4/5.

- [ ] **Step 4: Add the checkbox + select to `ProductForm.tsx`**

In `components/admin/ProductForm.tsx`:

1. Add imports: `Controller` is already imported; add `useEffect, useRef` to the `useState` import line, and destructure `setValue` from `useForm`.

```ts
import { useEffect, useRef, useState } from "react";
```

```ts
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof productSchema>, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });
```

2. After the `variants`/`accessories`/`watchedAccessories` block, add a watch on `category` that resets `featuredPosition` when the category changes (spec §5 — category change always drops featured status):

```ts
  const category = useWatch({ control, name: "category" });
  const initialCategory = useRef(defaultValues.category);
  useEffect(() => {
    if (category !== initialCategory.current) {
      setValue("featuredPosition", null);
      initialCategory.current = category;
    }
  }, [category, setValue]);
```

3. In the flags `<section>` (currently just `isNew`/`isBestseller`, `components/admin/ProductForm.tsx:155-169`), add the featured checkbox + select after the existing flex-wrap block:

```tsx
      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex flex-wrap gap-6">
          {(
            [
              ["isNew", "Новинка"],
              ["isBestseller", "Хіт"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex items-center gap-2 text-base">
              <input type="checkbox" {...register(name)} className="h-5 w-5 rounded-md" />
              {label}
            </label>
          ))}
        </div>

        <Controller
          control={control}
          name="featuredPosition"
          render={({ field }) => {
            const isFeatured = field.value !== null && field.value !== undefined;
            return (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-base">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => field.onChange(e.target.checked ? 1 : null)}
                    className="h-5 w-5 rounded-md"
                  />
                  Показувати в топі
                </label>
                {isFeatured && (
                  <select
                    value={field.value ?? 1}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-auto rounded-2xl border border-[#EDE0D4] px-4 py-2 text-base outline-none transition-all duration-300 ease-in-out focus:border-[#C9A96E]"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        Позиція {n}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          }}
        />
      </section>
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: passes.

- [ ] **Step 7: Commit**

```bash
git add components/admin/ProductForm.tsx components/admin/NewProductForm.tsx app/admin/products/[id]/edit/page.tsx
git commit -m "feat(admin): add featured-position checkbox and position select to product form"
```

---

### Task 8: Admin product list — "Топ #N" badge

**Files:**
- Modify: `app/admin/products/page.tsx`

**Interfaces:**
- Consumes: `p.featuredPosition` (already present on `listProductsAction`'s Prisma rows once Task 1 lands — `findMany` without a `select` clause returns every scalar column).

- [ ] **Step 1: Add the badge**

In `app/admin/products/page.tsx`, update the badges block (`app/admin/products/page.tsx:83-88`):

```tsx
                    {/* Badges */}
                    {(p.isNew || p.isBestseller || p.featuredPosition !== null) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.featuredPosition !== null && <Badge>Топ #{p.featuredPosition}</Badge>}
                        {p.isNew && <Badge>Новинка</Badge>}
                        {p.isBestseller && <Badge>Хіт</Badge>}
                      </div>
                    )}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add app/admin/products/page.tsx
git commit -m "feat(admin): show a Топ #N badge on featured products in the admin list"
```

---

### Task 9: Manual verification

No files change in this task — it's the `verify` pass called out in `CLAUDE.md` for UI work (this feature touches the admin form and public catalog rendering, `lint`+`typecheck` alone are not sufficient sign-off).

- [ ] **Step 1: Run lint + typecheck one more time on the full diff**

```bash
npm run lint && npm run typecheck
```
Expected: both pass.

- [ ] **Step 2: Start the dev server and walk the scenarios from the spec's testing section**

Run: `npm run dev`, then in the browser (admin at `/admin/products`, catalog at `/catalog/dresses`):

1. Create 4 products in "Основна колекція" (dress). Mark them top 1, 2, 3 (leave the 4th unfeatured). Visit `/catalog/dresses` with the "За замовчуванням" sort — confirm the order is: top #1, top #2, top #3, then the rest by creation date (newest first).
2. Un-feature the product at top #2 (uncheck the box, save). Reload the catalog — confirm top #3's product is now displayed where top #2 was (positions compressed, no gap), and the previously-#3 item now shows as "Топ #2" in the admin list.
3. Edit the top #1 product and change its category to "Кутюрна колекція" (couture). Confirm: the checkbox unchecks automatically in the form before you even save; after saving, the product is no longer featured in either category's list, and the dress catalog's remaining top items shift up to fill the gap.
4. On `/catalog/dresses`, switch the sort to "Спочатку дешеві" — confirm featured products do NOT stay pinned to the top; the list re-sorts purely by price.
5. Feature 10 products in one category (fill the cap). Feature an 11th product at position 1. Confirm the product that was at position 10 automatically loses its "Топ" badge in the admin list (falls back to date-sorted).
6. Delete a featured product. Confirm the remaining featured items in that category compress (no gap left behind).

Report back with pass/fail for each scenario — do not mark this task done until all six pass.

- [ ] **Step 3: Fix any issues found, then stop — no auto-commit**

Per prior guidance from the user, implement fixes but leave final review/commit decisions to the user rather than committing automatically after this step.
