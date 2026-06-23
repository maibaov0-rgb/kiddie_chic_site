import Link from "next/link";
import Image from "next/image";
import { listProductsAction } from "./actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

const CATEGORY_LABEL: Record<string, string> = {
  dress: "Сукні",
  couture: "Кутюр",
  accessory: "Аксесуари",
};

export default async function ProductsPage() {
  const products = await listProductsAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Товари</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-[#F4C6C6] px-5 py-3 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-[#efb4b4]"
        >
          + Додати товар
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center text-[#9b8b7e] shadow-soft">
          Поки немає товарів. Натисніть «Додати товар».
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => {
            const prices = p.variants.map((v) => Number(v.price));
            const min = prices.length ? Math.min(...prices) : 0;
            const max = prices.length ? Math.max(...prices) : 0;
            return (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#FDF8F4]">
                  {p.images[0] && (
                    <Image src={p.images[0]} alt="" fill className="object-cover" sizes="64px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name_uk}</p>
                  <p className="text-sm text-[#9b8b7e]">
                    {CATEGORY_LABEL[p.category]} ·{" "}
                    {min === max ? `${min} ₴` : `${min}–${max} ₴`}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.isNew && <Badge>Новинка</Badge>}
                    {p.isBestseller && <Badge>Хіт</Badge>}
                    {p.isHidden && <Badge>Прихований</Badge>}
                    {!p.inStock && <Badge>Немає</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="rounded-full px-4 py-2 text-sm transition-all duration-300 ease-in-out hover:bg-[#FDF8F4]"
                  >
                    Редагувати
                  </Link>
                  <DeleteProductButton id={p.id} name={p.name_uk} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#FDF8F4] px-3 py-1 text-xs text-[#9b8b7e]">
      {children}
    </span>
  );
}
