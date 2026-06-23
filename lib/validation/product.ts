import { z } from "zod";

export const variantSchema = z.object({
  size: z.string().min(1, "Оберіть розмір"),
  fabric: z.string().min(1, "Оберіть тканину"),
  price: z.coerce.number().positive("Ціна обов'язкова і має бути більшою за 0"),
});

export const productSchema = z.object({
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
});

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
