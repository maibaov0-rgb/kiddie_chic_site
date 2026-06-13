'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import {
  COLORS,
  FABRICS,
  SIZES,
  filterProducts,
  type Filters,
  type Product,
} from '@/lib/catalog';
import ProductCard from './ProductCard';

const EMPTY: Filters = { sizes: [], colors: [], fabrics: [] };

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function CatalogView({ products }: { products: Product[] }) {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => filterProducts(products, filters), [products, filters]);
  const activeCount = filters.sizes.length + filters.colors.length + filters.fabrics.length;

  function resultsLabel(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return t('resultsOne', { count: n });
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return t('resultsFew', { count: n });
    return t('resultsMany', { count: n });
  }

  const controls = (
    <FilterControls locale={locale} filters={filters} setFilters={setFilters} />
  );

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="bg-pink-soft sticky top-24 rounded-3xl p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-sans text-sm font-bold uppercase tracking-[0.15em] text-foreground/50">
              {t('filters.title')}
            </h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY)}
                className="font-sans text-xs font-medium text-gold transition-opacity hover:opacity-60"
              >
                {t('filters.reset')}
              </button>
            )}
          </div>
          {controls}
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        {/* Top bar: count + mobile filter trigger */}
        <div className="mb-5 flex items-center justify-between">
          <p className="font-sans text-sm text-foreground/50">{resultsLabel(filtered.length)}</p>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="bg-pink-soft inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-sans text-sm font-medium text-foreground/70 shadow-card transition-all hover:text-gold md:hidden"
          >
            <SlidersHorizontal size={15} />
            {t('filters.open')}
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-20 text-center shadow-card">
            <p className="font-sans text-foreground/50">{t('empty')}</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY)}
              className="mt-4 font-sans text-sm font-semibold text-gold underline underline-offset-4"
            >
              {t('filters.reset')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      <div
        className={`fixed inset-0 z-50 bg-black/25 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      <div
        className={`bg-pink-soft fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl p-6 pb-8 shadow-float transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-sans text-lg font-semibold text-foreground">{t('filters.title')}</h2>
          <button
            type="button"
            aria-label={tCommon('close')}
            onClick={() => setDrawerOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-powder-100 text-foreground/60"
          >
            <X size={18} />
          </button>
        </div>
        {controls}
        <div className="mt-6 flex gap-3">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY)}
              className="h-12 flex-1 rounded-full bg-powder-100 font-sans text-sm font-semibold text-foreground/70"
            >
              {t('filters.reset')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="h-12 flex-[2] rounded-full bg-powder-200 font-sans text-sm font-semibold text-foreground/80 transition-colors hover:bg-powder-300 hover:text-foreground"
          >
            {t('filters.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterControls({
  locale,
  filters,
  setFilters,
}: {
  locale: string;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  const t = useTranslations('catalog.filters');

  return (
    <div className="flex flex-col gap-6">
      {/* Size */}
      <div>
        <h3 className="mb-2.5 font-sans text-xs font-bold uppercase tracking-wider text-foreground/40">
          {t('size')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const on = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, sizes: toggle(f.sizes, size) }))}
                className={`rounded-full border px-3.5 py-1.5 font-sans text-xs font-medium transition-all ${
                  on
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-foreground/15 text-foreground/60 hover:border-gold/50'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="mb-2.5 font-sans text-xs font-bold uppercase tracking-wider text-foreground/40">
          {t('color')}
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => {
            const on = filters.colors.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                title={locale === 'en' ? c.name_en : c.name_uk}
                aria-label={locale === 'en' ? c.name_en : c.name_uk}
                onClick={() => setFilters((f) => ({ ...f, colors: toggle(f.colors, c.id) }))}
                className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 transition-all ${
                  on ? 'ring-2 ring-gold ring-offset-2' : 'ring-foreground/15 hover:ring-gold/50'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {on && (
                  <Check
                    size={14}
                    className={c.id === 'white' || c.id === 'powder' ? 'text-foreground/70' : 'text-white'}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fabric */}
      <div>
        <h3 className="mb-2.5 font-sans text-xs font-bold uppercase tracking-wider text-foreground/40">
          {t('fabric')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {FABRICS.map((fab) => {
            const on = filters.fabrics.includes(fab.id);
            return (
              <button
                key={fab.id}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, fabrics: toggle(f.fabrics, fab.id) }))}
                className={`rounded-full border px-3.5 py-1.5 font-sans text-xs font-medium transition-all ${
                  on
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-foreground/15 text-foreground/60 hover:border-gold/50'
                }`}
              >
                {locale === 'en' ? fab.name_en : fab.name_uk}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
