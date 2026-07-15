'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  COLORS,
  SIZES,
  filterProducts,
  type Filters,
  type Product,
} from '@/lib/catalog';
import ProductCard from './ProductCard';
import { CheckboxItem } from '@/components/ui/checkbox-item';

const EMPTY: Filters = { sizes: [], colors: [] };
const PAGE_SIZE = 24;

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function CatalogView({ products }: { products: Product[] }) {
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tCommon = useTranslations('common');
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => filterProducts(products, filters), [products, filters]);
  const activeCount = filters.sizes.length + filters.colors.length;

  // Reset pagination whenever the filters change (React-recommended pattern:
  // adjust state during render instead of in an effect, avoiding an extra render pass)
  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setVisibleCount(PAGE_SIZE);
  }

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

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
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground/65">
              {t('filters.title')}
            </h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY)}
                className="inline-flex min-h-11 items-center px-1 text-xs font-medium text-gold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:rounded"
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
          <p className="text-sm text-foreground/65" aria-live="polite">{resultsLabel(filtered.length)}</p>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="bg-pink-soft inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-foreground/75 shadow-card transition-all hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:hidden"
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
            <p className="text-foreground/70">{t('empty')}</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY)}
              className="mt-4 inline-flex min-h-11 items-center px-3 text-sm font-semibold text-gold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:rounded-full"
            >
              {t('filters.reset')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="bg-pink-soft inline-flex h-12 min-w-44 items-center justify-center rounded-full px-8 text-sm font-semibold text-foreground/80 shadow-card transition-all duration-300 ease-in-out hover:bg-powder-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  {t('showMore')}
                </button>
              </div>
            )}
          </>
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
        role="dialog"
        aria-modal="true"
        aria-label={t('filters.title')}
        className={`bg-pink-soft fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl p-6 shadow-float transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t('filters.title')}</h2>
          <button
            type="button"
            aria-label={tCommon('close')}
            onClick={() => setDrawerOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-powder-100 text-foreground/70 transition-colors hover:bg-powder-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
              className="h-12 flex-1 rounded-full bg-powder-100 text-sm font-semibold text-foreground/80 transition-colors hover:bg-powder-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              {t('filters.reset')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="h-12 flex-[2] rounded-full bg-powder-200 text-sm font-semibold text-foreground/85 transition-colors hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
        <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-foreground/60">
          {t('size')}
        </h3>
        <div className="grid grid-cols-2 gap-x-2">
          {SIZES.map((size) => (
            <CheckboxItem
              key={size}
              label={size}
              checked={filters.sizes.includes(size)}
              onChange={() => setFilters((f) => ({ ...f, sizes: toggle(f.sizes, size) }))}
            />
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-foreground/60">
          {t('color')}
        </h3>
        <div className="max-h-72 overflow-y-auto pr-1">
          {COLORS.map((c) => (
            <CheckboxItem
              key={c.id}
              label={locale === 'en' ? c.name_en : c.name_uk}
              checked={filters.colors.includes(c.id)}
              onChange={() => setFilters((f) => ({ ...f, colors: toggle(f.colors, c.id) }))}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
