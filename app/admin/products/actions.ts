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
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") throw new Error("UNAUTHORIZED");
}

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
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

  try {
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
        isHidden: false,
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
  } catch (error) {
    // Concurrent creates of the same name can race the slug @unique constraint.
    if (isPrismaErrorWithCode(error, "P2002")) {
      return {
        ok: false,
        error: "Товар із такою назвою вже існує. Змініть назву та спробуйте ще раз.",
      };
    }
    return { ok: false, error: "Не вдалося зберегти товар. Спробуйте ще раз." };
  }
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

  // Slug is intentionally NOT recomputed on rename — it keeps product URLs
  // stable once created. Variants are replaced wholesale; OrderItem snapshots
  // its own copy, so order history is unaffected.
  try {
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
  } catch {
    return { ok: false, error: "Не вдалося зберегти зміни. Спробуйте ще раз." };
  }

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

  try {
    await prisma.product.delete({ where: { id } }); // variants cascade
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2003")) {
      return {
        ok: false,
        error: "Неможливо видалити товар: є пов'язані замовлення.",
      };
    }
    return { ok: false, error: "Не вдалося видалити товар. Спробуйте ще раз." };
  }
  revalidatePath("/admin/products");
  return { ok: true };
}
