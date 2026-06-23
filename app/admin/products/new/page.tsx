import { NewProductForm } from "@/components/admin/NewProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Новий товар</h1>
      <NewProductForm />
    </div>
  );
}
