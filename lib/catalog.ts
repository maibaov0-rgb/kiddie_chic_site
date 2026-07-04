// Catalog domain types, filter facets, and pure helpers.
//
// Data access (DB-backed) lives in `lib/products.ts` (server-only) so this
// module stays safe to import from client components — it carries no Prisma.

export type CategorySlug = 'dresses' | 'couture' | 'accessories';
export type ProductCategory = 'dress' | 'couture' | 'accessory';

const SLUG_TO_CATEGORY: Record<CategorySlug, ProductCategory> = {
  dresses: 'dress',
  couture: 'couture',
  accessories: 'accessory',
};

export function categoryFromSlug(slug: string): ProductCategory | null {
  return slug in SLUG_TO_CATEGORY ? SLUG_TO_CATEGORY[slug as CategorySlug] : null;
}

// ─── Filter facets ──────────────────────────────────────────────────────────

export interface ColorOption {
  id: string;
  name_uk: string;
  name_en: string;
  hex: string;
}

export const SIZES = ['86-92', '98-104', '110-116', '122-128', '134-140'] as const;

export const COLORS: ColorOption[] = [
  { id: 'white', name_uk: 'Білий', name_en: 'White', hex: '#FFFFFF' },
  { id: 'powder', name_uk: 'Пудровий', name_en: 'Powder', hex: '#F4C6C6' },
  { id: 'mint', name_uk: "М'ятний", name_en: 'Mint', hex: '#C4E7DC' },
  { id: 'blue', name_uk: 'Блакитний', name_en: 'Blue', hex: '#BBD3E8' },
  { id: 'gold', name_uk: 'Золотий', name_en: 'Gold', hex: '#C9A96E' },
];

// ─── Product shape (mirrors Prisma) ───────────────────────────────────────────

export interface ProductVariant {
  id: string;
  size: string;
  price: number;
}

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
  variants: ProductVariant[]; // empty for couture
}

// ─── Pure helpers (operate on already-fetched products) ───────────────────────

export function cover(product: Product): string {
  return product.images[0] ?? '/images/hero/dress-1.jpg';
}

export function minPrice(product: Product): number | null {
  if (product.variants.length === 0) return null;
  return Math.min(...product.variants.map((v) => v.price));
}

export interface Filters {
  sizes: string[];
  colors: string[];
}

export function filterProducts(products: Product[], f: Filters): Product[] {
  return products.filter((p) => {
    const sizeOk = f.sizes.length === 0 || p.variants.some((v) => f.sizes.includes(v.size));
    const colorOk = f.colors.length === 0 || p.colors.some((c) => f.colors.includes(c));
    return sizeOk && colorOk;
  });
}
