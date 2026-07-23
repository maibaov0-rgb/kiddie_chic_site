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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { slug, isHidden: false },
    include: { variants: { orderBy: { price: 'asc' } }, accessories: true },
  });
  return row ? mapProduct(row) : null;
}
