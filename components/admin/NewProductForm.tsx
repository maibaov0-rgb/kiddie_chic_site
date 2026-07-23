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
  inStock: true, // no longer editable — actions.ts forces this true on save
  isNew: false,
  isBestseller: false,
  featuredPosition: null,
  variants: [{ size: "86-92", price: undefined as unknown as number }],
  accessories: [],
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
