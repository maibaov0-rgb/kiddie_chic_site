"use client";

import { ProductForm } from "@/components/admin/ProductForm";
import { createProductAction } from "@/app/admin/products/actions";
import type { ProductInput } from "@/lib/validation/product";

const EMPTY: ProductInput = {
  category: "dress",
  name_uk: "",
  name_en: "",
  description_uk: "",
  description_en: "",
  images: [],
  colors: [],
  inStock: true,
  isNew: false,
  isBestseller: false,
  variants: [{ size: "86-92", fabric: "satin", price: undefined as unknown as number }],
};

export function NewProductForm() {
  return (
    <ProductForm
      defaultValues={EMPTY}
      onSubmit={(input) => createProductAction(input)}
      submitLabel="Створити товар"
    />
  );
}
