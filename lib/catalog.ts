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
}

export const SIZES = [
  '74-86',
  '86-92',
  '92-98',
  '98-104',
  '104-110',
  '110-116',
  '116-122',
  '122-128',
  '128-134',
  '134-140',
  '140-146',
  '146-152',
] as const;

export const COLORS: ColorOption[] = [
  { id: 'ivory', name_uk: 'Айворі', name_en: 'Ivory' },
  { id: 'ivory-blue', name_uk: 'Айворі+блакитний', name_en: 'Ivory+Blue' },
  { id: 'ivory-lavender', name_uk: 'Айворі+лаванда', name_en: 'Ivory+Lavender' },
  { id: 'ivory-powder', name_uk: 'Айворі+пудра', name_en: 'Ivory+Powder' },
  { id: 'ivory-pink', name_uk: 'Айворі+рожевий', name_en: 'Ivory+Pink' },
  { id: 'white', name_uk: 'Білий', name_en: 'White' },
  { id: 'white-blue', name_uk: 'Білий+блакитний', name_en: 'White+Blue' },
  { id: 'white-raspberry', name_uk: 'Білий+малиновий', name_en: 'White+Raspberry' },
  { id: 'white-powder', name_uk: 'Білий+пудра', name_en: 'White+Powder' },
  { id: 'blue-light', name_uk: 'Блакитний', name_en: 'Light Blue' },
  { id: 'blue-light-ivory', name_uk: 'Блакитний+айворі', name_en: 'Light Blue+Ivory' },
  { id: 'burgundy', name_uk: 'Бордовий', name_en: 'Burgundy' },
  { id: 'bottle-green', name_uk: 'Бутилочний', name_en: 'Bottle Green' },
  { id: 'butter', name_uk: 'Вершкове масло', name_en: 'Butter' },
  { id: 'denim', name_uk: 'Джинс', name_en: 'Denim' },
  { id: 'yellow', name_uk: 'Жовтий', name_en: 'Yellow' },
  { id: 'green', name_uk: 'Зелений', name_en: 'Green' },
  { id: 'gold', name_uk: 'Золото', name_en: 'Gold' },
  { id: 'cappuccino', name_uk: 'Капучино', name_en: 'Cappuccino' },
  { id: 'unicorn', name_uk: 'Колір єдинорога', name_en: 'Unicorn' },
  { id: 'brown', name_uk: 'Коричневий', name_en: 'Brown' },
  { id: 'lavender', name_uk: 'Лаванда', name_en: 'Lavender' },
  { id: 'lavender-ivory', name_uk: 'Лаванда+айворі', name_en: 'Lavender+Ivory' },
  { id: 'mint', name_uk: "М'ята", name_en: 'Mint' },
  { id: 'raspberry', name_uk: 'Малиновий', name_en: 'Raspberry' },
  { id: 'milky', name_uk: 'Молочний', name_en: 'Milky' },
  { id: 'rich-pink', name_uk: 'Насичено рожевий', name_en: 'Rich Pink' },
  { id: 'sky', name_uk: 'Небесний', name_en: 'Sky Blue' },
  { id: 'olive', name_uk: 'Оливковий', name_en: 'Olive' },
  { id: 'off-white', name_uk: 'Офф-вайт', name_en: 'Off-White' },
  { id: 'peach', name_uk: 'Персиковий', name_en: 'Peach' },
  { id: 'orange', name_uk: 'Помаранчевий', name_en: 'Orange' },
  { id: 'powder', name_uk: 'Пудра', name_en: 'Powder' },
  { id: 'powder-ivory', name_uk: 'Пудра+айворі', name_en: 'Powder+Ivory' },
  { id: 'purple', name_uk: 'Пурпурний', name_en: 'Purple' },
  { id: 'multicolor', name_uk: 'Різнокольоровий', name_en: 'Multicolor' },
  { id: 'rose-powder', name_uk: 'Рожева пудра', name_en: 'Rose Powder' },
  { id: 'rose-powder-ivory', name_uk: 'Рожева пудра+айворі', name_en: 'Rose Powder+Ivory' },
  { id: 'pink', name_uk: 'Рожевий', name_en: 'Pink' },
  { id: 'pink-ivory', name_uk: 'Рожевий+айворі', name_en: 'Pink+Ivory' },
  { id: 'pink-blue', name_uk: 'Рожевий+блакитний', name_en: 'Pink+Blue' },
  { id: 'pink-mint', name_uk: "Рожевий+м'ята", name_en: 'Pink+Mint' },
  { id: 'barbie-pink', name_uk: 'Рожевий-барбі', name_en: 'Barbie Pink' },
  { id: 'gray', name_uk: 'Сірий', name_en: 'Gray' },
  { id: 'blue', name_uk: 'Синій', name_en: 'Blue' },
  { id: 'silver', name_uk: 'Срібний', name_en: 'Silver' },
  { id: 'tiffany', name_uk: 'Тіфані', name_en: 'Tiffany' },
  { id: 'navy', name_uk: 'Темно-синій', name_en: 'Navy' },
  { id: 'violet', name_uk: 'Фіолетовий', name_en: 'Violet' },
  { id: 'pistachio', name_uk: 'Фісташковий', name_en: 'Pistachio' },
  { id: 'red', name_uk: 'Червоний', name_en: 'Red' },
  { id: 'black', name_uk: 'Чорний', name_en: 'Black' },
  { id: 'black-cappuccino', name_uk: 'Чорний+капучино', name_en: 'Black+Cappuccino' },
  { id: 'black-powder', name_uk: 'Чорний+пудра', name_en: 'Black+Powder' },
  { id: 'champagne', name_uk: 'Шампань', name_en: 'Champagne' },
  { id: 'chocolate', name_uk: 'Шоколадний', name_en: 'Chocolate' },
];

export function colorSwatch(id: string): ColorOption {
  return COLORS.find((c) => c.id === id) ?? { id, name_uk: id, name_en: id };
}

export function colorName(id: string, en: boolean): string {
  const c = colorSwatch(id);
  return en ? c.name_en : c.name_uk;
}

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

// ─── Product shape (mirrors Prisma) ───────────────────────────────────────────

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
  accessories: ProductAccessory[]; // empty for couture and dresses with no accessories
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
