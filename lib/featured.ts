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
