'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Minus, Plus, ShoppingBag, Clock, ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { colorName, accessoryTypeName, cover, type Product } from '@/lib/catalog';
import { asset } from '@/lib/asset';
import { useCartStore } from '@/lib/stores/cart';
import { ColorPill } from './ColorPill';

// Each accessory gets its own qty stepper and its own "added" confirmation —
// entirely separate from the dress's qty and its "Додати в кошик" button, so
// adding an accessory never makes it look like the dress itself was added.
function AccessoryRow({
  name,
  price,
  onAdd,
  decreaseLabel,
  increaseLabel,
  addLabel,
}: {
  name: string;
  price: number;
  onAdd: (qty: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
  addLabel: string;
}) {
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const id = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(id);
  }, [justAdded]);

  function handleAdd() {
    onAdd(qty);
    setJustAdded(true);
  }

  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-sm font-medium text-foreground/80">{name}</span>
        <span className="font-sans text-sm font-bold text-gold">{price.toLocaleString('uk-UA')} ₴</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div className="flex h-11 items-center rounded-full bg-milk shadow-card">
          <button
            type="button"
            aria-label={decreaseLabel}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/65 transition-colors hover:bg-powder-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <Minus size={14} />
          </button>
          <span
            className="min-w-6 px-1 text-center text-sm font-semibold text-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {qty}
          </span>
          <button
            type="button"
            aria-label={increaseLabel}
            onClick={() => setQty((q) => q + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/65 transition-colors hover:bg-powder-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          aria-label={addLabel}
          onClick={handleAdd}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-powder-200 text-foreground/80 transition-all duration-300 ease-in-out hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          {justAdded ? <Check size={16} /> : <Plus size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ProductDetail({ product }: { product: Product }) {
  const locale = useLocale();
  const en = locale === 'en';
  const t = useTranslations('product');
  const addItem = useCartStore((s) => s.addItem);

  const name = en ? product.name_en : product.name_uk;
  const description = en ? product.description_en : product.description_uk;

  // Selection — kept valid via "effective" fallbacks instead of effects.
  // Sizes come straight from the product's own variants (not the SIZES preset
  // list) so a preset change never hides a size that's already for sale.
  const sizes = [...new Set(product.variants.map((v) => v.size))];
  const [size, setSize] = useState(sizes[0] ?? '');

  const [colorRaw, setColor] = useState(product.colors[0] ?? '');
  const color = product.colors.includes(colorRaw) ? colorRaw : (product.colors[0] ?? '');

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [addedTick, setAddedTick] = useState(0);
  const added = addedTick > 0;
  // Separate from `added` above: that one drives the shared "added to cart"
  // toast for both the dress and its accessories. This one drives only the
  // main "Додати в кошик" button's own checkmark, so adding an accessory
  // doesn't visually claim the dress itself was added.
  const [productJustAdded, setProductJustAdded] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(product.images.length > 1);

  useEffect(() => {
    if (!showSwipeHint) return;
    const id = setTimeout(() => setShowSwipeHint(false), 1800);
    return () => clearTimeout(id);
  }, [showSwipeHint]);

  function prevImg() {
    setActiveImg((i) => (i - 1 + product.images.length) % product.images.length);
  }
  function nextImg() {
    setActiveImg((i) => (i + 1) % product.images.length);
  }

  // Auto-dismiss "added" toast 5s after last add; new add resets the timer.
  useEffect(() => {
    if (!addedTick) return;
    const id = setTimeout(() => setAddedTick(0), 5000);
    return () => clearTimeout(id);
  }, [addedTick]);

  // Auto-dismiss the main button's own checkmark 2s after the dress is added.
  useEffect(() => {
    if (!productJustAdded) return;
    const id = setTimeout(() => setProductJustAdded(false), 2000);
    return () => clearTimeout(id);
  }, [productJustAdded]);

  const variant = product.variants.find((v) => v.size === size) ?? null;
  const price = variant?.price ?? null;

  function handleAdd() {
    if (!variant) return;
    addItem({
      kind: 'product',
      productId: product.id,
      variantId: variant.id,
      name,
      size: variant.size,
      color: color || null,
      price: variant.price,
      qty,
      imageUrl: cover(product),
    });
    setAddedTick((n) => n + 1);
    setProductJustAdded(true);
  }

  function handleAddAccessory(a: Product['accessories'][number], accessoryQty: number) {
    addItem({
      kind: 'accessory',
      productId: product.id,
      accessoryId: a.id,
      name: accessoryTypeName(a.type, en),
      price: a.price,
      qty: accessoryQty,
    });
    setAddedTick((n) => n + 1);
  }

  return (
    <div className="grid gap-8 md:grid-cols-[42%_1fr] md:gap-12">
      {/* ── Gallery ───────────────────────────────────────── */}
      <div>
        {/* Mobile: horizontal swipe — each image fills the width, centered */}
        <div
          className="relative flex snap-x snap-mandatory overflow-x-auto pb-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onTouchStart={() => setShowSwipeHint(false)}
          onScroll={() => setShowSwipeHint(false)}
        >
          {product.images.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden rounded-3xl shadow-card"
            >
              <Image src={asset(src)} alt={`${name} ${i + 1}`} fill sizes="100vw" className="object-cover" priority={i === 0} />
            </div>
          ))}
          <AnimatePresence>
            {showSwipeHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  animate={{ x: [-18, 18, -18] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white/85 shadow-float"
                >
                  <Hand size={22} className="text-powder-300" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop: main + thumbnails */}
        <div className="hidden md:block">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] shadow-float">
            <Image
              src={asset(product.images[activeImg] ?? cover(product))}
              alt={name}
              fill
              sizes="42vw"
              className="object-cover"
              priority
            />
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label={t('prevImage')}
                  onClick={prevImg}
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-powder-300 shadow-card transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label={t('nextImage')}
                  onClick={nextImg}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-powder-300 shadow-card transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
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
        </div>

        <h1 className="font-sans text-2xl font-semibold leading-snug text-foreground md:text-3xl">{name}</h1>

        {price !== null && (
          <p className="mt-3 font-sans text-2xl font-bold text-gold">{price.toLocaleString('uk-UA')} ₴</p>
        )}

        <p className="mt-4 font-sans text-base leading-relaxed text-foreground/60">{description}</p>

        {/* Size */}
        <div className="mt-7">
          <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-foreground/60">
            {t('size')}
          </h3>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full min-h-11 rounded-2xl border border-foreground/20 bg-white px-4 text-sm font-medium text-foreground/80 outline-none transition-all focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            {sizes.map((s) => {
              const sizePrice = product.variants.find((v) => v.size === s)?.price ?? null;
              return (
                <option key={s} value={s}>
                  {s}
                  {sizePrice !== null ? ` (${sizePrice.toLocaleString('uk-UA')} ₴)` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Color */}
        {product.colors.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-foreground/60">
              {t('color')}: <span className="text-foreground/60">{colorName(color, en)}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((cid) => (
                <ColorPill key={cid} id={cid} en={en} selected={cid === color} onClick={() => setColor(cid)} />
              ))}
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
            disabled={!variant}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-powder-200 px-6 font-sans text-base font-semibold text-foreground/85 shadow-card transition-all hover:bg-powder-300 hover:text-foreground hover:shadow-float disabled:pointer-events-none disabled:opacity-40"
          >
            {productJustAdded ? <Check size={18} /> : <ShoppingBag size={17} />}
            {t('addToCart')}
          </button>
        </div>

        {/* Accessories */}
        {product.accessories.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-foreground/60">
              {t('accessoriesTitle')}
            </h3>
            <div className="space-y-2">
              {product.accessories.map((a) => (
                <AccessoryRow
                  key={a.id}
                  name={accessoryTypeName(a.type, en)}
                  price={a.price}
                  onAdd={(accessoryQty) => handleAddAccessory(a, accessoryQty)}
                  decreaseLabel={t('decreaseQty')}
                  increaseLabel={t('increaseQty')}
                  addLabel={t('addAccessory', { name: accessoryTypeName(a.type, en) })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Secondary CTAs */}
        <div className="mt-4">
          <a
            href="https://wa.me/380991234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-sans text-sm font-medium text-foreground/65 shadow-card transition-colors hover:text-gold"
          >
            <Clock size={15} />
            {t('askDelivery')}
          </a>
        </div>
      </div>

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
