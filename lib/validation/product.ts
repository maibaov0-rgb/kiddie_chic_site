import { z } from "zod";

export const variantSchema = z.object({
  size: z.string().min(1, "Оберіть розмір"),
  fabric: z.string().min(1, "Оберіть тканину"),
  price: z.coerce.number().positive("Ціна має бути більшою за 0"),
});

export const productSchema = z.object({
  category: z.enum(["dress", "couture", "accessory"]),
  name_uk: z.string().min(1, "Введіть назву (укр)"),
  name_en: z.string().min(1, "Введіть назву (eng)"),
  description_uk: z.string().min(1, "Введіть опис (укр)"),
  description_en: z.string().min(1, "Введіть опис (eng)"),
  images: z.array(z.string().url()).default([]),
  colors: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
  isNew: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  variants: z.array(variantSchema).min(1, "Додайте хоча б один варіант"),
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
