"use client";

import { ProductForm } from "@/components/admin/ProductForm";
import { updateProductAction } from "@/app/admin/products/actions";
import type { ProductInput } from "@/lib/validation/product";

export function EditProductForm({
  id,
  defaultValues,
}: {
  id: string;
  defaultValues: ProductInput;
}) {
  return (
    <ProductForm
      defaultValues={defaultValues}
      onSubmit={(input) => updateProductAction(id, input)}
      submitLabel="Зберегти зміни"
    />
  );
}
