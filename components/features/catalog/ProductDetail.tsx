'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Minus, Plus, ShoppingBag, Clock, Scissors } from 'lucide-react';
import { COLORS, FABRICS, SIZES, cover, type Product } from '@/lib/catalog';
import { asset } from '@/lib/asset';
import { useCartStore } from '@/lib/stores/cart';

function colorName(id: string, en: boolean): string {
  const c = COLORS.find((x) => x.id === id);
  return c ? (en ? c.name_en : c.name_uk) : id;
}
function fabricName(id: string, en: boolean): string {
  const f = FABRICS.find((x) => x.id === id);
  return f ? (en ? f.name_en : f.name_uk) : id;
}

export default function ProductDetail({ product }: { product: Product }) {
  const locale = useLocale();
  const en = locale === 'en';
  const t = useTranslations('product');
  const addItem = useCartStore((s) => s.addItem);

  const name = en ? product.name_en : product.name_uk;
  const description = en ? product.description_en : product.description_uk;

  // Selection — kept valid via "effective" fallbacks instead of effects
  const sizes = SIZES.filter((s) => product.variants.some((v) => v.size === s));
  const [size, setSize] = useState(sizes[0] ?? '');
  const fabricsForSize = FABRICS.map((f) => f.id).filter((fid) =>
    product.variants.some((v) => v.size === size && v.fabric === fid),
  );
  const [fabricRaw, setFabric] = useState(fabricsForSize[0] ?? '');
  const fabric = fabricsForSize.includes(fabricRaw) ? fabricRaw : (fabricsForSize[0] ?? '');

  const [colorRaw, setColor] = useState(product.colors[0] ?? '');
  const color = product.colors.includes(colorRaw) ? colorRaw : (product.colors[0] ?? '');

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [addedTick, setAddedTick] = useState(0);
  const added = addedTick > 0;

  // Auto-dismiss "added" toast 5s after last add; new add resets the timer.
  useEffect(() => {
    if (!addedTick) return;
    const id = setTimeout(() => setAddedTick(0), 5000);
    return () => clearTimeout(id);
  }, [addedTick]);

  const variant = product.variants.find((v) => v.size === size && v.fabric === fabric) ?? null;
  const price = variant?.price ?? null;

  function handleAdd() {
    if (!variant || !product.inStock) return;
    addItem({
      productId: product.id,
      variantId: variant.id,
      name,
      size: variant.size,
      fabric: variant.fabric,
      color: color || null,
      price: variant.price,
      qty,
      imageUrl: cover(product),
    });
    setAddedTick((n) => n + 1);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      {/* ── Gallery ───────────────────────────────────────── */}
      <div>
        {/* Mobile: horizontal swipe — each image fills the width, centered */}
        <div className="flex snap-x snap-mandatory overflow-x-auto pb-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {product.images.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden rounded-3xl shadow-card"
            >
              <Image src={asset(src)} alt={`${name} ${i + 1}`} fill sizes="100vw" className="object-cover" priority={i === 0} />
            </div>
          ))}
        </div>

        {/* Desktop: main + thumbnails */}
        <div className="hidden md:block">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] shadow-float">
            <Image
              src={asset(product.images[activeImg] ?? cover(product))}
              alt={name}
              fill
              sizes="50vw"
              className="object-cover"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-[3/4] w-20 overflow-hidden rounded-2xl transition-all ${
                    i === activeImg ? 'ring-2 ring-gold ring-offset-2' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={asset(src)} alt={`${name} ${i + 1}`} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Info & selection ──────────────────────────────── */}
      <div className="md:pt-2">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {product.isNew && (
            <span className="rounded-full bg-powder-100 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-foreground/60">
              {t('isNew')}
            </span>
          )}
          {product.isBestseller && (
            <span className="rounded-full bg-gold/15 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-gold">
              {t('isBestseller')}
            </span>
          )}
          <span
            className={`rounded-full px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest ${
              product.inStock ? 'bg-beige-200 text-foreground/60' : 'bg-foreground/10 text-foreground/50'
            }`}
          >
            {product.inStock ? t('inStock') : t('outOfStock')}
          </span>
        </div>

        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{name}</h1>

        {price !== null && (
          <p className="mt-3 font-sans text-2xl font-bold text-gold">{price.toLocaleString('uk-UA')} ₴</p>
        )}

        <p className="mt-4 font-sans text-base leading-relaxed text-foreground/60">{description}</p>

        {/* Size */}
        <div className="mt-7">
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-foreground/60">
            {t('size')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={s === size}
                className={`inline-flex min-h-11 min-w-12 items-center justify-center rounded-full border px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
                  s === size ? 'border-gold bg-gold/10 text-gold' : 'border-foreground/20 text-foreground/75 hover:border-gold/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Fabric */}
        <div className="mt-6">
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-foreground/60">
            {t('fabric')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {fabricsForSize.map((fid) => (
              <button
                key={fid}
                type="button"
                onClick={() => setFabric(fid)}
                aria-pressed={fid === fabric}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
                  fid === fabric ? 'border-gold bg-gold/10 text-gold' : 'border-foreground/20 text-foreground/75 hover:border-gold/50'
                }`}
              >
                {fabricName(fid, en)}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        {product.colors.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-foreground/60">
              {t('color')}: <span className="text-foreground/60">{colorName(color, en)}</span>
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((cid) => {
                const c = COLORS.find((x) => x.id === cid);
                if (!c) return null;
                const on = cid === color;
                return (
                  <button
                    key={cid}
                    type="button"
                    aria-label={colorName(cid, en) ?? cid}
                    aria-pressed={on}
                    onClick={() => setColor(cid)}
                    className={`flex h-11 w-11 items-center justify-center rounded-full ring-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
                      on ? 'ring-2 ring-gold ring-offset-2' : 'ring-foreground/20 hover:ring-gold/50'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {on && (
                      <Check size={16} className={cid === 'white' || cid === 'powder' ? 'text-foreground/70' : 'text-white'} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantity + add to cart */}
        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-12 items-center rounded-full bg-white shadow-card">
            <button
              type="button"
              aria-label={t('decreaseQty')}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-powder-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              <Minus size={16} />
            </button>
            <span
              className="min-w-7 px-1 text-center text-base font-semibold text-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              {qty}
            </span>
            <button
              type="button"
              aria-label={t('increaseQty')}
              onClick={() => setQty((q) => q + 1)}
              className="flex h-12 w-12 items-center justify-center rounded-full text-foreground/75 transition-colors hover:bg-powder-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock || !variant}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-powder-200 px-6 font-sans text-sm font-bold uppercase tracking-wider text-foreground/80 shadow-card transition-all hover:bg-powder-300 hover:text-foreground hover:shadow-float disabled:pointer-events-none disabled:opacity-40"
          >
            {added ? <Check size={18} /> : <ShoppingBag size={17} />}
            {t('addToCart')}
          </button>
        </div>

        {/* Secondary CTAs */}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <a
            href="https://wa.me/380991234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-sans text-sm font-medium text-foreground/65 shadow-card transition-colors hover:text-gold"
          >
            <Clock size={15} />
            {t('askDelivery')}
          </a>
          <a
            href="https://wa.me/380991234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-sans text-sm font-medium text-foreground/65 shadow-card transition-colors hover:text-gold"
          >
            <Scissors size={15} />
            {t('customOrder')}
          </a>
        </div>
      </div>

      {/* Sticky mobile buy bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-foreground/10 bg-white px-4 pt-3 md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {price !== null && (
          <span className="shrink-0 text-lg font-bold text-gold">{price.toLocaleString('uk-UA')} ₴</span>
        )}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.inStock || !variant}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-powder-200 text-sm font-bold uppercase tracking-wider text-foreground/85 transition-colors hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:opacity-40"
        >
          {added ? <Check size={18} /> : <ShoppingBag size={16} />}
          {t('addToCart')}
        </button>
      </div>

      {/* Spacer so sticky bar doesn't cover content on mobile */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      {/* ── "Added to cart" toast with explicit next-step choices ───── */}
      <AnimatePresence>
        {added && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            role="status"
            aria-live="polite"
            className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-3xl bg-foreground/95 px-5 py-4 text-white shadow-float md:inset-x-auto md:bottom-8 md:left-1/2 md:-translate-x-1/2"
          >
            <div className="flex items-center gap-2.5 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/25">
                <Check size={15} className="text-gold-100" />
              </span>
              <span className="font-medium">{t('addedToCart')}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddedTick(0)}
                className="flex-1 rounded-full bg-white/12 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-white/20"
              >
                {t('continueShopping')}
              </button>
              <Link
                href="/cart"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-powder-200 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-foreground/85 transition-colors hover:bg-powder-300 hover:text-foreground"
              >
                {t('goToCart')}
                <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
