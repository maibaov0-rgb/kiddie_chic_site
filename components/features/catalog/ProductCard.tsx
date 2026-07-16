'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { cover, minPrice, type Product } from '@/lib/catalog';
import { asset } from '@/lib/asset';

export default function ProductCard({ product }: { product: Product }) {
  const locale = useLocale();
  const en = locale === 'en';
  const t = useTranslations('product');
  const tc = useTranslations('catalog');
  const [liked, setLiked] = useState(false);

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


      </div>

      {/* Info */}
      <div className="mt-3 px-0.5">
        <h3 className="font-sans text-sm font-medium leading-snug text-foreground md:text-[15px]">
          {name}
        </h3>
        {from !== null && (
          <p className="mt-1 font-sans text-sm font-bold text-gold">
            <span className="font-medium text-foreground/40">{tc('priceFrom')} </span>
            {from.toLocaleString('uk-UA')} ₴
          </p>
        )}
      </div>
    </Link>
  );
}
