"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProductAction } from "@/app/admin/products/actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Видалити товар «${name}»?`)) return;
    start(async () => {
      await deleteProductAction(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="rounded-full px-4 py-2 text-sm text-[#9b4a4a] transition-all duration-300 ease-in-out hover:bg-[#F4C6C6]/30 disabled:opacity-60"
    >
      {pending ? "…" : "Видалити"}
    </button>
  );
}
