import Link from "next/link";
import Image from "next/image";
import { listProductsAction } from "./actions";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

const CATEGORY_LABEL: Record<string, string> = {
  dress: "Основна колекція",
  couture: "Кутюрна колекція",
};

export default async function ProductsPage() {
  const products = await listProductsAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Товари</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-[#F4C6C6] px-4 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out hover:bg-[#efb4b4] sm:px-5 sm:py-3 sm:text-base"
        >
          + Додати
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 text-center text-[#9b8b7e] shadow-soft">
          Поки немає товарів. Натисніть «+ Додати».
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => {
            const prices = p.variants.map((v) => Number(v.price));
            const min = prices.length ? Math.min(...prices) : 0;
            const max = prices.length ? Math.max(...prices) : 0;
            const priceLabel = prices.length
              ? min === max
                ? `${min} ₴`
                : `${min}–${max} ₴`
              : "—";

            return (
              <li key={p.id} className="rounded-3xl bg-white p-3 shadow-soft sm:p-4">
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#FDF8F4] sm:h-16 sm:w-16 sm:rounded-2xl">
                    {p.images[0] && (
                      <Image
                        src={p.images[0]}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Name + action buttons on same row */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold sm:text-base">
                        {p.name_uk || <span className="text-[#9b8b7e]">Без назви</span>}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out hover:bg-[#FDF8F4] sm:px-4 sm:py-2 sm:text-sm"
                        >
                          <span className="sm:hidden">Ред.</span>
                          <span className="hidden sm:inline">Редагувати</span>
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name_uk} />
                      </div>
                    </div>

                    {/* Category + price */}
                    <p className="mt-0.5 text-xs text-[#9b8b7e] sm:text-sm">
                      {CATEGORY_LABEL[p.category] ?? p.category} · {priceLabel}
                    </p>

                    {/* Badges */}
                    {(p.isNew || p.isBestseller) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.isNew && <Badge>Новинка</Badge>}
                        {p.isBestseller && <Badge>Хіт</Badge>}
                      </div>
                    )}
                  </div>
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
    <span className="rounded-full bg-[#FDF8F4] px-2.5 py-0.5 text-xs text-[#9b8b7e]">
      {children}
    </span>
  );
}
