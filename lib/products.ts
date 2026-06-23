// Server-only: Prisma-backed product queries.
// Do NOT import this from client components — use lib/catalog.ts for types/helpers.

import { prisma } from '@/lib/prisma';
import type { Product, ProductVariant, ProductCategory } from '@/lib/catalog';

function mapVariant(v: {
  id: string;
  size: string;
  fabric: string;
  price: { toNumber(): number } | number | string;
}): ProductVariant {
  return {
    id: v.id,
    size: v.size,
    fabric: v.fabric,
    price: typeof v.price === 'object' && 'toNumber' in v.price
      ? v.price.toNumber()
      : Number(v.price),
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
  };
}

export async function getProductsByCategory(
  category: ProductCategory,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { category, isHidden: false },
    orderBy: { createdAt: 'desc' },
    include: { variants: { orderBy: { price: 'asc' } } },
  });
  return rows.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { slug, isHidden: false },
    include: { variants: { orderBy: { price: 'asc' } } },
  });
  return row ? mapProduct(row) : null;
}
