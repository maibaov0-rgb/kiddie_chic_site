'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Undo2,
  X,
} from 'lucide-react';
import { COLORS, FABRICS } from '@/lib/catalog';
import { asset } from '@/lib/asset';
import { useCartStore, type CartItem } from '@/lib/stores/cart';

function colorName(id: string | null, en: boolean): string | null {
  if (!id) return null;
  const c = COLORS.find((x) => x.id === id);
  return c ? (en ? c.name_en : c.name_uk) : id;
}
function fabricName(id: string | null, en: boolean): string | null {
  if (!id) return null;
  const f = FABRICS.find((x) => x.id === id);
  return f ? (en ? f.name_en : f.name_uk) : id;
}

function fmt(amount: number, locale: string): string {
  return amount.toLocaleString(locale === 'en' ? 'en-US' : 'uk-UA');
}

export default function CartView() {
  const locale = useLocale();
  const en = locale === 'en';
  const t = useTranslations('cart');

  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const addItem = useCartStore((s) => s.addItem);

  // Hydration guard — store reads localStorage on client only
  const hydrated = useSyncExternalStore(
    (cb) => useCartStore.persist.onFinishHydration(cb),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );

  // Undo toast
  const [undoItem, setUndoItem] = useState<CartItem | null>(null);
  useEffect(() => {
    if (!undoItem) return;
    const id = setTimeout(() => setUndoItem(null), 5000);
    return () => clearTimeout(id);
  }, [undoItem]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);

  function handleRemove(item: CartItem) {
    removeItem(item.productId, item.variantId);
    setUndoItem(item);
  }
  function handleUndo() {
    if (!undoItem) return;
    addItem(undoItem);
    setUndoItem(null);
  }

  // ── Empty state ────────────────────────────────────────────────
  if (hydrated && items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-28 text-center md:pb-24 md:pt-32">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-powder-100">
          <ShoppingBag size={36} className="text-powder-300" strokeWidth={1.5} />
        </div>
        <h1 className="mt-7 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {t('empty')}
        </h1>
        <p className="mx-auto mt-3 max-w-md font-sans text-base leading-relaxed text-foreground/55">
          {t('emptyDesc')}
        </p>
        <Link
          href="/catalog"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-powder-200 px-7 font-sans text-base font-semibold text-foreground/85 shadow-card transition-all hover:bg-powder-300 hover:text-foreground hover:shadow-float"
        >
          {t('emptyCta')}
          <ArrowRight size={16} />
        </Link>
      </section>
    );
  }

  // ── Cart with items ────────────────────────────────────────────
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-28 pt-28 md:px-6 md:pb-16 md:pt-32">
      {/* Heading */}
      <header className="mb-6 md:mb-10">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {t('title')}
          </h1>
          {hydrated && totalCount > 0 && (
            <span className="rounded-full bg-powder-100 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-foreground/55">
              {t('items', { count: totalCount })}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[13px] text-foreground/60 md:mt-2 md:text-base">{t('subtitle')}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
        {/* ── Items list ─────────────────────────────────────── */}
        <ul className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {hydrated &&
              items.map((item) => (
                <motion.li
                  key={`${item.productId}:${item.variantId ?? 'na'}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="relative overflow-hidden rounded-3xl bg-white p-2.5 shadow-card md:p-4"
                >
                  <div className="flex gap-3 md:gap-5">
                    {/* Image */}
                    <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-2xl bg-beige-100 md:w-32">
                      {item.imageUrl ? (
                        <Image
                          src={asset(item.imageUrl)}
                          alt={item.name}
                          fill
                          sizes="(min-width: 768px) 128px, 80px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate font-sans text-sm font-medium leading-tight text-foreground md:text-base">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          aria-label={t('remove')}
                          className="-mr-1.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/55 transition-colors hover:bg-powder-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Attributes */}
                      <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-foreground/65 md:mt-1.5 md:text-[13px]">
                        {item.size && (
                          <div>
                            <dt className="inline text-foreground/55">{t('size')}: </dt>
                            <dd className="inline text-foreground/80">{item.size}</dd>
                          </div>
                        )}
                        {item.fabric && (
                          <div>
                            <dt className="inline text-foreground/55">{t('fabric')}: </dt>
                            <dd className="inline text-foreground/80">{fabricName(item.fabric, en)}</dd>
                          </div>
                        )}
                        {item.color && (
                          <div>
                            <dt className="inline text-foreground/55">{t('color')}: </dt>
                            <dd className="inline text-foreground/80">{colorName(item.color, en)}</dd>
                          </div>
                        )}
                      </dl>

                      {/* Bottom row: qty + price */}
                      <div className="mt-auto flex items-end justify-between gap-2 pt-2.5 md:pt-4">
                        <div className="flex h-11 items-center rounded-full bg-milk shadow-card">
                          <button
                            type="button"
                            aria-label={t('decreaseQty')}
                            onClick={() => updateQty(item.productId, item.variantId, item.qty - 1)}
                            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/65 transition-colors hover:bg-powder-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                          >
                            <Minus size={15} />
                          </button>
                          <span
                            className="min-w-6 px-1 text-center text-sm font-semibold text-foreground md:text-base"
                            aria-live="polite"
                            aria-atomic="true"
                          >
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={t('increaseQty')}
                            onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)}
                            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/65 transition-colors hover:bg-powder-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <p className="text-lg font-bold text-gold md:text-xl">
                          {fmt(item.price * item.qty, locale)} ₴
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
          </AnimatePresence>

          {/* Continue shopping */}
          <Link
            href="/catalog"
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full px-3 text-sm text-foreground/65 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <ArrowRight size={14} className="rotate-180" />
            {t('continueShopping')}
          </Link>
        </ul>

        {/* ── Summary (desktop sticky) ─────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-white p-5 shadow-float md:p-7">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-serif text-lg font-semibold text-foreground md:text-xl">{t('total')}</span>
              <span className="text-2xl font-bold text-gold md:text-3xl">
                {hydrated ? `${fmt(subtotal, locale)} ₴` : '—'}
              </span>
            </div>

            <Link
              href="/checkout"
              className="mt-6 hidden h-12 w-full items-center justify-center gap-2 rounded-full bg-powder-200 px-6 text-sm font-bold uppercase tracking-wider text-foreground/85 shadow-card transition-all hover:bg-powder-300 hover:text-foreground hover:shadow-float lg:flex"
            >
              {t('checkout')}
              <ArrowRight size={16} />
            </Link>

            {/* Trust row */}
            <ul className="mt-5 space-y-2 text-[12px] text-foreground/55 md:mt-6 md:space-y-2.5 md:text-[13px]">
              <li className="flex items-center gap-2.5">
                <ShieldCheck size={14} className="shrink-0 text-gold/80" strokeWidth={1.8} />
                {t('trustPay')}
              </li>
              <li className="flex items-center gap-2.5">
                <Truck size={14} className="shrink-0 text-gold/80" strokeWidth={1.8} />
                {t('trustShip')}
              </li>
              <li className="flex items-center gap-2.5">
                <Undo2 size={14} className="shrink-0 text-gold/80" strokeWidth={1.8} />
                {t('trustReturn')}
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* ── Sticky mobile checkout bar ──────────────────────── */}
      {hydrated && items.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-foreground/10 bg-white px-4 pt-3 lg:hidden"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="text-[10px] font-medium uppercase tracking-widest text-foreground/60">
                {t('total')}
              </span>
              <span className="font-sans text-xl font-bold text-gold">
                {fmt(subtotal, locale)} ₴
              </span>
            </div>
            <Link
              href="/checkout"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-powder-200 font-sans text-base font-semibold text-foreground/85 transition-colors hover:bg-powder-300 hover:text-foreground"
            >
              {t('checkout')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Undo toast ──────────────────────────────────────── */}
      <AnimatePresence>
        {undoItem && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            role="status"
            aria-live="polite"
            className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full bg-foreground/95 py-2 pl-5 pr-2 text-sm text-white shadow-float lg:bottom-8"
          >
            <span>{t('removed')}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/15 px-4 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Undo2 size={13} />
              {t('undo')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
