'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpDown, Check } from 'lucide-react';
import { SORT_OPTIONS, type SortOption } from '@/lib/catalog';

function labelFor(t: ReturnType<typeof useTranslations>, option: SortOption): string {
  if (option === 'price-asc') return t('priceAsc');
  if (option === 'price-desc') return t('priceDesc');
  return t('default');
}

export default function SortMenu({
  sort,
  onChange,
}: {
  sort: SortOption;
  onChange: (s: SortOption) => void;
}) {
  const t = useTranslations('catalog.sort');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="bg-pink-soft inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-foreground/75 shadow-card transition-all duration-300 ease-in-out hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        <ArrowUpDown size={15} />
        {t('label')}
      </button>

      {/* Mobile: bottom-sheet. Desktop: popover anchored under the button. */}
      <div
        className={`fixed inset-0 z-50 bg-black/25 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />
      <div
        role="menu"
        className={`bg-pink-soft fixed inset-x-0 bottom-0 z-50 rounded-t-3xl p-4 shadow-float transition-transform duration-300 ease-in-out sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+0.5rem)] sm:w-56 sm:rounded-3xl sm:p-2 sm:transition-opacity ${
          open
            ? 'translate-y-0 sm:translate-y-0 sm:opacity-100'
            : 'pointer-events-none translate-y-full sm:translate-y-0 sm:opacity-0'
        }`}
        style={{ paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
      >
        {SORT_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="menuitemradio"
            aria-checked={sort === option}
            onClick={() => {
              onChange(option);
              setOpen(false);
            }}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-sm text-foreground/80 transition-colors duration-300 ease-in-out hover:bg-gold/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            {labelFor(t, option)}
            {sort === option && <Check size={15} strokeWidth={3} className="text-gold" />}
          </button>
        ))}
      </div>
    </div>
  );
}
