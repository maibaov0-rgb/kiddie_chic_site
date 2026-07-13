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
  hex2?: string; // second tone for two-color combos (rendered as a split swatch)
  dark?: boolean; // true when the swatch needs a dark checkmark/label for contrast
}

export const SIZES = ['74-86', '86-92', '92-98', '98-104', '104-110'] as const;

export const COLORS: ColorOption[] = [
  { id: 'ivory', name_uk: 'Айворі', name_en: 'Ivory', hex: '#F5EEDD', dark: true },
  { id: 'ivory-blue', name_uk: 'Айворі+блакитний', name_en: 'Ivory + Blue', hex: '#F5EEDD', hex2: '#BBD3E8', dark: true },
  { id: 'ivory-lavender', name_uk: 'Айворі+лаванда', name_en: 'Ivory + Lavender', hex: '#F5EEDD', hex2: '#D9CBEA', dark: true },
  { id: 'ivory-powder', name_uk: 'Айворі+пудра', name_en: 'Ivory + Powder', hex: '#F5EEDD', hex2: '#F4C6C6', dark: true },
  { id: 'ivory-pink', name_uk: 'Айворі+рожевий', name_en: 'Ivory + Pink', hex: '#F5EEDD', hex2: '#EFA8B8', dark: true },
];

// Legacy color ids stored on products created before a palette change fall
// back to a neutral swatch instead of silently disappearing from the UI.
const FALLBACK_COLOR: ColorOption = { id: '', name_uk: '', name_en: '', hex: '#D9D2C7', dark: true };

export function colorSwatch(id: string): ColorOption {
  return COLORS.find((c) => c.id === id) ?? { ...FALLBACK_COLOR, id, name_uk: id, name_en: id };
}

export function colorName(id: string, en: boolean): string {
  const c = colorSwatch(id);
  return en ? c.name_en : c.name_uk;
}

export function swatchBackground(c: Pick<ColorOption, 'hex' | 'hex2'>): string {
  return c.hex2 ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hex2} 50%)` : c.hex;
}

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
