'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ArrowRight } from 'lucide-react';
import { asset } from '@/lib/asset';

const PLACEHOLDER_PRODUCTS = [
  { id: '1', name: 'Сукня «Ніжна троянда»',    price: 1890, badge: 'Нове', image: '/images/hero/dress-5.jpg' },
  { id: '2', name: 'Сукня «Золота осінь»',      price: 2490, badge: 'Хіт',  image: '/images/hero/dress-4.jpg' },
  { id: '3', name: 'Сукня «Молочна хмаринка»',  price: 1690, badge: null,   image: '/images/hero/dress-2.jpg' },
  { id: '4', name: 'Сукня «Пудровий вечір»',    price: 2190, badge: 'Нове', image: '/images/hero/dress-3.jpg' },
] as const;

export default function NewArrivals() {
  const t  = useTranslations('home.featured');
  const tP = useTranslations('product');

  return (
    <section className="px-3 py-2 md:px-4">
      {/* Floating card wrapper */}
      <div className="rounded-3xl bg-white px-5 py-8 shadow-card md:rounded-[2.5rem] md:px-8 md:py-12">

        {/* Header row */}
        <div className="mb-8 flex items-end justify-between md:mb-10">
          <div>
            <span className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              Колекція
            </span>
            <h2 className="font-sans text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {t('title')}
            </h2>
          </div>
          <Link
            href="/catalog/dresses"
            className="group hidden items-center gap-2 rounded-full border border-foreground/15 px-5 py-2.5 font-sans text-sm font-medium text-foreground/55 transition-all hover:border-gold hover:text-gold md:flex"
          >
            Всі товари
            <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {PLACEHOLDER_PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} addToCartLabel={tP('addToCart')} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 flex justify-center md:hidden">
          <Link
            href="/catalog/dresses"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-foreground/15 px-6 font-sans text-sm font-medium text-foreground/60 transition-all hover:border-gold hover:text-gold"
          >
            Всі товари <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  addToCartLabel,
}: {
  product: (typeof PLACEHOLDER_PRODUCTS)[number];
  addToCartLabel: string;
}) {
  return (
    <Link href="/catalog/dresses" className="group block">
      {/* Image area — floating card inside card */}
      <div className="relative overflow-hidden rounded-2xl aspect-[3/4] shadow-card transition-shadow duration-300 group-hover:shadow-float">
        <Image
          src={asset(product.image)}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {/* Badge */}
        {product.badge && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-white/85 px-3 py-1 font-sans text-[9px] font-bold uppercase tracking-widest text-foreground/70 backdrop-blur-sm shadow-card">
            {product.badge}
          </span>
        )}

        {/* Wishlist */}
        <button
          aria-label="Вибране"
          className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-foreground/40 backdrop-blur-sm shadow-card transition-all hover:scale-110 hover:bg-white hover:text-gold"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={13} />
        </button>

        {/* Hover CTA */}
        <div className="absolute inset-x-3 bottom-3 translate-y-14 rounded-xl bg-foreground/85 py-2.5 text-center transition-transform duration-300 group-hover:translate-y-0 backdrop-blur-sm">
          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-white">
            {addToCartLabel}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 px-0.5">
        <h3 className="font-sans text-sm font-medium leading-snug text-foreground md:text-[15px]">
          {product.name}
        </h3>
        <p className="mt-1 font-sans text-sm font-bold text-gold">
          {product.price.toLocaleString('uk-UA')} ₴
        </p>
      </div>
    </Link>
  );
}
