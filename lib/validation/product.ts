import { z } from "zod";

export const variantSchema = z.object({
  size: z.string().min(1, "Оберіть розмір"),
  price: z.coerce.number().positive("Ціна обов'язкова і має бути більшою за 0"),
});

export const accessorySchema = z.object({
  type: z.enum([
    "headband",
    "gloves",
    "bag",
    "choker",
    "train",
    "wristband",
    "hairpiece",
    "bowTrain",
    "dressBow",
    "basqueTrain",
    "slipperTies",
    "sleeves",
    "wristbandSet2",
    "dressBowSet2",
    "skirt",
    "hairBows5",
    "headbandButterfly",
    "headbandFlower",
    "hairBowMedium",
    "hairBowLarge",
    "headbandPlain",
    "glovesWithBows",
    "glovesPlain",
    "handBows",
  ]),
  price: z.coerce.number().positive("Ціна обов'язкова і має бути більшою за 0"),
});

export const productSchema = z
  .object({
    category: z.enum(["dress", "couture"]),
    name_uk: z.string().default(""),
    name_en: z.string().default(""),
    description_uk: z.string().default(""),
    description_en: z.string().default(""),
    images: z.array(z.string().url()).min(1, "Додайте хоча б одне фото"),
    colors: z.array(z.string()).default([]),
    inStock: z.boolean().default(true),
    isNew: z.boolean().default(false),
    isBestseller: z.boolean().default(false),
    featuredPosition: z
      .preprocess(
        (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
        z.union([
          z.number().int().min(1, "Позиція від 1 до 10").max(10, "Позиція від 1 до 10"),
          z.null(),
        ]),
      )
      .default(null),
    variants: z.array(variantSchema).min(1, "Додайте хоча б один варіант"),
    accessories: z.array(accessorySchema).max(4).default([]),
  })
  .refine(
    (data) => new Set(data.accessories.map((a) => a.type)).size === data.accessories.length,
    { message: "Кожен тип аксесуара можна додати лише один раз", path: ["accessories"] },
  );

export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type AccessoryInput = z.infer<typeof accessorySchema>;
