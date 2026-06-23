import { notFound } from "next/navigation";
import { getProductAction } from "../../actions";
import { EditProductForm } from "@/components/admin/EditProductForm";
import type { ProductInput } from "@/lib/validation/product";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductAction(id);
  if (!product) notFound();

  const defaultValues: ProductInput = {
    category: product.category as "dress" | "couture",
    name_uk: product.name_uk,
    name_en: product.name_en,
    description_uk: product.description_uk,
    description_en: product.description_en,
    images: product.images,
    colors: product.colors,
    inStock: product.inStock,
    isNew: product.isNew,
    isBestseller: product.isBestseller,
    variants: product.variants.map((v) => ({
      size: v.size,
      fabric: v.fabric,
      price: Number(v.price),
    })),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Редагувати товар</h1>
      <EditProductForm id={id} defaultValues={defaultValues} />
    </div>
  );
}
