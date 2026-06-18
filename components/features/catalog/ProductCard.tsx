'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, Check } from 'lucide-react';
import { COLORS, cover, minPrice, type Product } from '@/lib/catalog';
import { asset } from '@/lib/asset';
import { useCartStore } from '@/lib/stores/cart';

export default function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const t = useTranslations('product');
  const tc = useTranslations('catalog');
  const addItem = useCartStore((s) => s.addItem);

  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);

  const name = locale === 'en' ? product.name_en : product.name_uk;
  const from = minPrice(product);
  const prices = product.variants.map((v) => v.price);
  const hasRange = prices.length > 1 && Math.min(...prices) !== Math.max(...prices);

  const colorDots = product.colors
    .map((id) => COLORS.find((c) => c.id === id))
    .filter((c): c is (typeof COLORS)[number] => Boolean(c));

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!product.inStock) return;
    const cheapest = [...product.variants].sort((a, b) => a.price - b.price)[0];
    if (!cheapest) return;
    addItem({
      productId: product.id,
      variantId: cheapest.id,
      name,
      size: cheapest.size,
      fabric: cheapest.fabric,
      color: product.colors[0] ?? null,
      price: cheapest.price,
      qty: 1,
      imageUrl: product.images[0] ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <Link href={`/catalog/dresses/${product.slug}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-card transition-shadow duration-300 group-hover:shadow-float">
        <Image
          src={asset(cover(product))}
          alt={name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="rounded-full bg-white/95 px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-widest text-foreground/70 shadow-card">
              {t('isNew')}
            </span>
          )}
          {product.isBestseller && (
            <span className="rounded-full bg-gold px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-widest text-white shadow-card">
              {t('isBestseller')}
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-full bg-foreground/80 px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-widest text-white shadow-card">
              {t('outOfStock')}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          aria-label={liked ? 'Видалити з вибраного' : 'Додати у вибране'}
          aria-pressed={liked}
          onClick={(e) => {
            e.preventDefault();
            setLiked((v) => !v);
          }}
          className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-foreground/60 shadow-card transition-all hover:scale-110 hover:bg-white hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <Heart size={15} className={liked ? 'fill-gold text-gold' : ''} />
        </button>

        {/* Buy CTA — slides up on hover (desktop), always reachable on tap */}
        {product.inStock && (
          <div className="absolute inset-x-2.5 bottom-2.5 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-powder-200 text-[11px] font-bold uppercase tracking-wide text-foreground/85 shadow-card transition-colors hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {added ? (
                <>
                  <Check size={14} /> {t('addedToCart')}
                </>
              ) : (
                t('addToCart')
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans text-sm font-medium leading-snug text-foreground md:text-[15px]">
            {name}
          </h3>
          {colorDots.length > 0 && (
            <div className="mt-1 flex shrink-0 items-center gap-1">
              {colorDots.map((c) => (
                <span
                  key={c.id}
                  title={locale === 'en' ? c.name_en : c.name_uk}
                  className="h-3 w-3 rounded-full ring-1 ring-foreground/10"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          )}
        </div>
        {from !== null && (
          <p className="mt-1 font-sans text-sm font-bold text-gold">
            {hasRange && <span className="font-medium text-foreground/40">{tc('priceFrom')} </span>}
            {from.toLocaleString('uk-UA')} ₴
          </p>
        )}
      </div>
    </Link>
  );
}
