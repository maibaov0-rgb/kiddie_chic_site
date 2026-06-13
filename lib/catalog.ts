// Catalog data layer.
//
// For now this serves curated mock products so the catalog UI is fully usable
// before the admin panel + Cloudinary are wired up. The shapes mirror the
// Prisma `Product` / `ProductVariant` models, so swapping these helpers for
// real DB queries later is a drop-in change.

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

export interface FabricOption {
  id: string;
  name_uk: string;
  name_en: string;
}

export const SIZES = ['86-92', '98-104', '110-116', '122-128', '134-140'] as const;

export const COLORS: ColorOption[] = [
  { id: 'white', name_uk: 'Білий', name_en: 'White', hex: '#FFFFFF' },
  { id: 'powder', name_uk: 'Пудровий', name_en: 'Powder', hex: '#F4C6C6' },
  { id: 'mint', name_uk: "М'ятний", name_en: 'Mint', hex: '#C4E7DC' },
  { id: 'blue', name_uk: 'Блакитний', name_en: 'Blue', hex: '#BBD3E8' },
  { id: 'gold', name_uk: 'Золотий', name_en: 'Gold', hex: '#C9A96E' },
];

export const FABRICS: FabricOption[] = [
  { id: 'satin', name_uk: 'Атлас', name_en: 'Satin' },
  { id: 'fatin', name_uk: 'Фатин', name_en: 'Tulle' },
  { id: 'lace', name_uk: 'Мереживо', name_en: 'Lace' },
  { id: 'organza', name_uk: 'Органза', name_en: 'Organza' },
];

// ─── Product shape (mirrors Prisma) ───────────────────────────────────────────

export interface ProductVariant {
  id: string;
  size: string;
  fabric: string; // FabricOption.id
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

const HERO = (n: number) => `/images/hero/dress-${n}.jpg`;

function variants(
  prices: Partial<Record<(typeof SIZES)[number], number>>,
  fabric: string,
): ProductVariant[] {
  return Object.entries(prices).map(([size, price]) => ({
    id: `${fabric}-${size}`,
    size,
    fabric,
    price: price as number,
  }));
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const DRESSES: Product[] = [
  {
    id: 'd1',
    slug: 'nizhna-troyanda',
    category: 'dress',
    name_uk: 'Сукня «Ніжна троянда»',
    name_en: 'Tender Rose Dress',
    description_uk: 'Пишна сукня з атласним ліфом і багатошаровою спідницею.',
    description_en: 'A full dress with a satin bodice and layered skirt.',
    images: [HERO(5), HERO(1)],
    colors: ['powder', 'white'],
    inStock: true,
    isNew: true,
    isBestseller: false,
    variants: [
      ...variants({ '98-104': 1890, '110-116': 1990, '122-128': 2090 }, 'satin'),
      ...variants({ '98-104': 2090, '110-116': 2190 }, 'organza'),
    ],
  },
  {
    id: 'd2',
    slug: 'zolota-osin',
    category: 'dress',
    name_uk: 'Сукня «Золота осінь»',
    name_en: 'Golden Autumn Dress',
    description_uk: 'Святкова сукня кольору шампань із золотими акцентами.',
    description_en: 'A champagne party dress with golden accents.',
    images: [HERO(2)],
    colors: ['gold', 'white'],
    inStock: true,
    isNew: false,
    isBestseller: true,
    variants: variants({ '110-116': 2490, '122-128': 2590, '134-140': 2690 }, 'lace'),
  },
  {
    id: 'd3',
    slug: 'molochna-hmarynka',
    category: 'dress',
    name_uk: 'Сукня «Молочна хмаринка»',
    name_en: 'Milky Cloud Dress',
    description_uk: 'Легка фатинова сукня молочного відтінку.',
    description_en: 'A light tulle dress in a milky shade.',
    images: [HERO(1)],
    colors: ['white'],
    inStock: true,
    isNew: false,
    isBestseller: false,
    variants: variants({ '86-92': 1690, '98-104': 1790, '110-116': 1890 }, 'fatin'),
  },
  {
    id: 'd4',
    slug: 'pudrovyy-vechir',
    category: 'dress',
    name_uk: 'Сукня «Пудровий вечір»',
    name_en: 'Powder Evening Dress',
    description_uk: 'Сукня зі шлейфом і пишним бантом на спині.',
    description_en: 'A dress with a train and a lush bow at the back.',
    images: [HERO(5)],
    colors: ['powder'],
    inStock: true,
    isNew: true,
    isBestseller: false,
    variants: variants({ '110-116': 2190, '122-128': 2290, '134-140': 2390 }, 'organza'),
  },
  {
    id: 'd5',
    slug: "myatnyy-tsvit",
    category: 'dress',
    name_uk: "Сукня «М'ятний цвіт»",
    name_en: 'Mint Blossom Dress',
    description_uk: "Сукня м'ятного кольору з мереживною спідницею.",
    description_en: 'A mint dress with a lace skirt.',
    images: [HERO(3)],
    colors: ['mint', 'white'],
    inStock: true,
    isNew: false,
    isBestseller: true,
    variants: variants({ '98-104': 1990, '110-116': 2090, '122-128': 2190 }, 'lace'),
  },
  {
    id: 'd6',
    slug: 'blakytna-feeriya',
    category: 'dress',
    name_uk: 'Сукня «Блакитна феєрія»',
    name_en: 'Azure Fantasy Dress',
    description_uk: 'Багатошарова фатинова сукня в блакитно-рожевих тонах.',
    description_en: 'A multi-layered tulle dress in blue and pink tones.',
    images: [HERO(4)],
    colors: ['blue', 'powder'],
    inStock: true,
    isNew: true,
    isBestseller: false,
    variants: variants({ '86-92': 1790, '98-104': 1890, '110-116': 1990 }, 'fatin'),
  },
  {
    id: 'd7',
    slug: 'bila-kazka',
    category: 'dress',
    name_uk: 'Сукня «Біла казка»',
    name_en: 'White Fairytale Dress',
    description_uk: 'Класична бальна сукня з мереживним рукавом.',
    description_en: 'A classic ball gown with lace sleeves.',
    images: [HERO(1)],
    colors: ['white'],
    inStock: false,
    isNew: false,
    isBestseller: false,
    variants: variants({ '122-128': 2790, '134-140': 2890 }, 'satin'),
  },
  {
    id: 'd8',
    slug: 'rozheva-mriya',
    category: 'dress',
    name_uk: 'Сукня «Рожева мрія»',
    name_en: 'Pink Dream Dress',
    description_uk: 'Атласна сукня з асиметричним шлейфом.',
    description_en: 'A satin dress with an asymmetric train.',
    images: [HERO(5)],
    colors: ['powder', 'gold'],
    inStock: true,
    isNew: false,
    isBestseller: true,
    variants: variants({ '110-116': 2390, '122-128': 2490 }, 'satin'),
  },
];

const COUTURE: Product[] = [1, 2, 3, 4, 5, 3].map((n, i) => ({
  id: `c${i + 1}`,
  slug: `couture-${i + 1}`,
  category: 'couture',
  name_uk: 'Кутюрна сукня ручної роботи',
  name_en: 'Handcrafted couture dress',
  description_uk: 'Ексклюзивна модель, що шиється індивідуально під замовлення.',
  description_en: 'An exclusive model, made to order individually.',
  images: [HERO(n)],
  colors: [],
  inStock: true,
  isNew: false,
  isBestseller: false,
  variants: [],
}));

// ─── Queries (swap for Prisma later) ──────────────────────────────────────────

export function getProductsByCategory(category: ProductCategory): Product[] {
  if (category === 'dress') return DRESSES;
  if (category === 'couture') return COUTURE;
  return [];
}

export function getProductBySlug(slug: string): Product | null {
  return [...DRESSES, ...COUTURE].find((p) => p.slug === slug) ?? null;
}

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
  fabrics: string[];
}

export function filterProducts(products: Product[], f: Filters): Product[] {
  return products.filter((p) => {
    const sizeOk = f.sizes.length === 0 || p.variants.some((v) => f.sizes.includes(v.size));
    const fabricOk = f.fabrics.length === 0 || p.variants.some((v) => f.fabrics.includes(v.fabric));
    const colorOk = f.colors.length === 0 || p.colors.some((c) => f.colors.includes(c));
    return sizeOk && fabricOk && colorOk;
  });
}
