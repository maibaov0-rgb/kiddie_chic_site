'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { cover, minPrice, type Product } from '@/lib/catalog';
import { asset } from '@/lib/asset';

export default function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const en = locale === 'en';
  const t = useTranslations('product');
  const tc = useTranslations('catalog');

  const name = en ? product.name_en : product.name_uk;
  const from = minPrice(product);

  return (
    <Link href={`/catalog/dresses/${product.slug}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-card transition-shadow duration-300 group-hover:shadow-float">
        <Image
          src={asset(cover(product))}
          alt={name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          quality={55}
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
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 px-0.5">
        <h3 className="font-sans text-sm font-bold leading-snug text-neutral-600 md:text-[15px]">
          {name}
        </h3>
        {from !== null && (
          <p className="mt-1 font-sans text-sm font-medium text-powder-300">
            {tc('priceFrom')} {from.toLocaleString('uk-UA')} ₴
          </p>
        )}
      </div>
    </Link>
  );
}
