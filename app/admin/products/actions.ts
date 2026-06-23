"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { productSchema, type ProductInput } from "@/lib/validation/product";
import { uniqueSlug } from "@/lib/slug";
import { deleteImage, publicIdFromUrl } from "@/lib/cloudinary";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
}

export async function listProductsAction() {
  await requireAdmin();
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: { orderBy: { price: "asc" } } },
  });
}

export async function getProductAction(id: string) {
  await requireAdmin();
  return prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
}

export async function createProductAction(
  input: ProductInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Перевірте заповнення полів" };
  }
  const data = parsed.data;
  const slug = await uniqueSlug(
    data.name_uk,
    async (s) => (await prisma.product.count({ where: { slug: s } })) > 0,
  );

  const created = await prisma.product.create({
    data: {
      slug,
      category: data.category,
      name_uk: data.name_uk,
      name_en: data.name_en,
      description_uk: data.description_uk,
      description_en: data.description_en,
      images: data.images,
      colors: data.colors,
      inStock: data.inStock,
      isNew: data.isNew,
      isBestseller: data.isBestseller,
      isHidden: data.isHidden,
      variants: {
        create: data.variants.map((v) => ({
          size: v.size,
          fabric: v.fabric,
          price: v.price,
          images: [],
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  return { ok: true, id: created.id };
}

export async function updateProductAction(
  id: string,
  input: ProductInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Перевірте заповнення полів" };
  }
  const data = parsed.data;

  await prisma.$transaction([
    prisma.productVariant.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        category: data.category,
        name_uk: data.name_uk,
        name_en: data.name_en,
        description_uk: data.description_uk,
        description_en: data.description_en,
        images: data.images,
        colors: data.colors,
        inStock: data.inStock,
        isNew: data.isNew,
        isBestseller: data.isBestseller,
        isHidden: data.isHidden,
        variants: {
          create: data.variants.map((v) => ({
            size: v.size,
            fabric: v.fabric,
            price: v.price,
            images: [],
          })),
        },
      },
    }),
  ]);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  return { ok: true, id };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id },
    select: { images: true },
  });
  if (!product) return { ok: false, error: "Товар не знайдено" };

  // Best-effort image cleanup — never blocks DB delete.
  await Promise.allSettled(
    product.images.map((url) => {
      const pid = publicIdFromUrl(url);
      return pid ? deleteImage(pid) : Promise.resolve();
    }),
  );

  await prisma.product.delete({ where: { id } }); // variants cascade
  revalidatePath("/admin/products");
  return { ok: true };
}
