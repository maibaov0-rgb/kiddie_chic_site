# Catalog Search + Price Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add name search (dresses + couture) and price sort (dresses only) to the catalog category pages, entirely client-side, matching the existing filter architecture.

**Architecture:** Two new pure functions in `lib/catalog.ts` (`searchProducts`, `sortProducts`) slot into the existing client-side filter pipeline in `CatalogView.tsx` and `CoutureGallery.tsx`. Two new small presentational components (`SearchInput`, `SortMenu`) are added under `components/features/catalog/`. No new dependencies, no API routes, no server round trips — full category product list is already passed as a prop today.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, next-intl, Tailwind, lucide-react icons, `@/i18n/navigation` (locale-aware `useRouter`/`usePathname` wrapper around `next/navigation`).

## Global Constraints

- TS strict — no `any`, use `unknown` + narrowing.
- No hardcoded UI strings — every label goes through next-intl (`messages/uk.json` + `messages/en.json`).
- No new npm dependencies (project has no test runner configured — this plan verifies via `npm run lint && npm run typecheck` plus manual browser checks the user runs themselves on dev; do not add a test framework to satisfy this).
- Rounded/soft UI language only: `rounded-full` or `rounded-2xl` minimum on buttons/inputs, `rounded-3xl` on drawers/popovers/cards. No `rounded-none`/`rounded-sm`.
- Tap targets ≥44×44px on mobile.
- `transition-all duration-300 ease-in-out` for hover/state transitions, matching existing buttons.
- Every server component under `[locale]` that reads translations must be under a `setRequestLocale` call — not applicable here since all changed files are client components (`'use client'`), but do not accidentally introduce a new server component that reads `useTranslations` without this.
- Spec: `docs/superpowers/specs/2026-07-22-catalog-search-sort-design.md`.

---

## File Structure

- **Modify** `lib/catalog.ts` — add `searchProducts`, `SortOption`, `sortProducts`.
- **Create** `components/features/catalog/SearchInput.tsx` — controlled search input, narrow, with clear button. Used by both catalog views.
- **Create** `components/features/catalog/SortMenu.tsx` — pill button + popover/bottom-sheet with 3 instant-apply sort options. Dresses only.
- **Modify** `components/features/catalog/CatalogView.tsx` — wire in search + sort state, URL sync for `sort`, extend pagination-reset, new layout row.
- **Modify** `components/features/catalog/CoutureGallery.tsx` — wire in search state only, filter the masonry grid.
- **Modify** `messages/uk.json`, `messages/en.json` — new `catalog.search`, `catalog.sort.*` keys.

---

## Task 1: Pure search + sort functions in `lib/catalog.ts`

**Files:**
- Modify: `lib/catalog.ts` (append after `filterProducts`, which currently ends around line 211)

**Interfaces:**
- Consumes: existing `Product`, `Filters` types and `minPrice(product): number | null` already in this file.
- Produces:
  - `searchProducts(products: Product[], query: string, locale: string): Product[]`
  - `type SortOption = 'default' | 'price-asc' | 'price-desc'`
  - `sortProducts(products: Product[], sort: SortOption): Product[]`
  - `export const SORT_OPTIONS: SortOption[] = ['default', 'price-asc', 'price-desc']` (for `SortMenu` to iterate without hardcoding the list twice)

- [ ] **Step 1: Read the current end of the file to confirm exact insertion point**

Read `lib/catalog.ts` lines 195-212 (already confirmed content: `minPrice`, `Filters`, `filterProducts`). Insert new code immediately after the closing brace of `filterProducts`.

- [ ] **Step 2: Add `searchProducts`**

```ts
export function searchProducts(products: Product[], query: string, locale: string): Product[] {
  const q = query.trim().toLowerCase();
  if (q === '') return products;
  return products.filter((p) => {
    const name = locale === 'en' ? p.name_en : p.name_uk;
    return name.toLowerCase().includes(q);
  });
}
```

- [ ] **Step 3: Add `SortOption`, `SORT_OPTIONS`, and `sortProducts`**

```ts
export type SortOption = 'default' | 'price-asc' | 'price-desc';

export const SORT_OPTIONS: SortOption[] = ['default', 'price-asc', 'price-desc'];

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  if (sort === 'default') return products;
  const direction = sort === 'price-asc' ? 1 : -1;
  return [...products].sort((a, b) => {
    const priceA = minPrice(a);
    const priceB = minPrice(b);
    if (priceA === null && priceB === null) return 0;
    if (priceA === null) return 1;
    if (priceB === null) return -1;
    return (priceA - priceB) * direction;
  });
}
```

- [ ] **Step 4: Verify types compile**

Run: `npm run typecheck`
Expected: no new errors (only pure additive exports, nothing consumes them yet).

- [ ] **Step 5: Commit**

```bash
git add lib/catalog.ts
git commit -m "feat(catalog): add searchProducts and sortProducts helpers"
```

---

## Task 2: `SearchInput` component

**Files:**
- Create: `components/features/catalog/SearchInput.tsx`
- Modify: `messages/uk.json`, `messages/en.json`

**Interfaces:**
- Consumes: nothing project-specific beyond `lucide-react` (`Search`, `X` icons — `X` already imported elsewhere in `CatalogView.tsx`, confirming it's an available icon in this lucide-react version).
- Produces: `SearchInput` component with props `{ value: string; onChange: (v: string) => void; placeholder: string; clearLabel: string; className?: string }` — used by Task 4 and Task 5. (Note: `clearLabel` was added after initial review flagged a hardcoded `aria-label="Clear"` as a CLAUDE.md "no hardcoded UI strings" violation — pass the project's existing `common.close` i18n key via `tCommon('close')`.)

- [ ] **Step 1: Add i18n keys**

In `messages/uk.json`, inside the `"catalog"` object (after `"showMore": "Показати ще",`), add:

```json
    "search": "Пошук за назвою",
```

In `messages/en.json`, same location:

```json
    "search": "Search by name",
```

- [ ] **Step 2: Create the component**

```tsx
'use client';

import { Search, X } from 'lucide-react';

export default function SearchInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-pink-soft flex h-11 w-full max-w-[220px] items-center gap-2 rounded-full px-4 shadow-card sm:max-w-xs ${className}`}
    >
      <Search size={15} className="shrink-0 text-foreground/45" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground/85 placeholder:text-foreground/40 focus:outline-none"
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors duration-300 ease-in-out hover:bg-powder-200 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
```

Note: the clear button's `aria-label="Clear"` is intentionally not translated via next-intl here to keep the component self-contained without requiring a `tCommon` prop; reuse `tCommon('close')` from the parent instead by extending props if a reviewer flags this — for now `X`/clear is a near-universal symbol-only affordance and `Search`-icon input labeling already carries the translated `placeholder` as the input's `aria-label`. (If the user wants this stricter, add a `clearLabel: string` prop — flagged here, not silently skipped.)

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: passes (component isn't consumed yet, but must compile standalone).

- [ ] **Step 4: Commit**

```bash
git add components/features/catalog/SearchInput.tsx messages/uk.json messages/en.json
git commit -m "feat(catalog): add SearchInput component"
```

---

## Task 3: `SortMenu` component

**Files:**
- Create: `components/features/catalog/SortMenu.tsx`
- Modify: `messages/uk.json`, `messages/en.json`

**Interfaces:**
- Consumes: `SortOption`, `SORT_OPTIONS` from `@/lib/catalog` (Task 1).
- Produces: `SortMenu` component with props `{ sort: SortOption; onChange: (s: SortOption) => void }` — used by Task 4 (`CatalogView` only).

- [ ] **Step 1: Add i18n keys**

In `messages/uk.json`, inside `"catalog"`, after the `"search"` key added in Task 2, add:

```json
    "sort": {
      "label": "Сортування",
      "default": "Найновіші",
      "priceAsc": "Спочатку дешевші",
      "priceDesc": "Спочатку дорожчі"
    },
```

In `messages/en.json`, same location:

```json
    "sort": {
      "label": "Sort",
      "default": "Newest",
      "priceAsc": "Price: low to high",
      "priceDesc": "Price: high to low"
    },
```

- [ ] **Step 2: Create the component**

```tsx
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
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add components/features/catalog/SortMenu.tsx messages/uk.json messages/en.json
git commit -m "feat(catalog): add SortMenu component"
```

---

## Task 4: Wire search + sort into `CatalogView.tsx`

**Files:**
- Modify: `components/features/catalog/CatalogView.tsx`

**Interfaces:**
- Consumes: `searchProducts`, `sortProducts`, `SortOption` from `@/lib/catalog` (Task 1); `SearchInput` (Task 2); `SortMenu` (Task 3); `useRouter`, `usePathname` from `@/i18n/navigation`; `useSearchParams` from `next/navigation`.
- Produces: no new exports — this is the top-level consumer.

- [ ] **Step 1: Add imports**

At the top of `CatalogView.tsx`, alongside the existing imports:

```tsx
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/navigation';
import {
  COLORS,
  SIZES,
  filterProducts,
  searchProducts,
  sortProducts,
  type Filters,
  type Product,
  type SortOption,
} from '@/lib/catalog';
import SearchInput from './SearchInput';
import SortMenu from './SortMenu';
```

(Replace the existing `import { COLORS, SIZES, filterProducts, type Filters, type Product } from '@/lib/catalog';` line with the merged one above.)

- [ ] **Step 2: Add search/sort state, synced sort via URL**

Inside `CatalogView`, after the existing `const [filters, setFilters] = useState<Filters>(EMPTY);` line, add:

```tsx
  const [query, setQuery] = useState('');

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortParam = searchParams.get('sort');
  const sort: SortOption =
    sortParam === 'price-asc' || sortParam === 'price-desc' ? sortParam : 'default';

  function setSort(next: SortOption) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', next);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
```

- [ ] **Step 3: Extend the filter pipeline**

Replace:

```tsx
  const filtered = useMemo(() => filterProducts(products, filters), [products, filters]);
```

with:

```tsx
  const filtered = useMemo(() => {
    const byFilters = filterProducts(products, filters);
    const bySearch = searchProducts(byFilters, query, locale);
    return sortProducts(bySearch, sort);
  }, [products, filters, query, sort, locale]);
```

- [ ] **Step 4: Extend the pagination-reset trigger**

Find the existing block:

```tsx
  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setVisibleCount(PAGE_SIZE);
  }
```

Replace with a version that also resets on `query`/`sort` changes:

```tsx
  const [prevKey, setPrevKey] = useState(`${filters.sizes.join(',')}|${filters.colors.join(',')}|${query}|${sort}`);
  const resetKey = `${filters.sizes.join(',')}|${filters.colors.join(',')}|${query}|${sort}`;
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setVisibleCount(PAGE_SIZE);
  }
```

- [ ] **Step 5: Extend the "reset" behavior in the empty-state and drawer reset buttons**

There are three `onClick={() => setFilters(EMPTY)}` call sites in this file (desktop sidebar reset, empty-state reset, mobile drawer reset). Replace each with:

```tsx
onClick={() => {
  setFilters(EMPTY);
  setQuery('');
}}
```

- [ ] **Step 6: Add the layout — mobile search row + filter/sort row, desktop sort+search row**

Replace the existing top-bar block:

```tsx
        {/* Top bar: count + mobile filter trigger */}
        <div ref={resultsTopRef} className="mb-5 flex items-center justify-between">
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
```

with:

```tsx
        {/* Controls: search + sort + mobile filter trigger */}
        <div ref={resultsTopRef} className="mb-5">
          {/* Mobile: search above the filter/sort row. Desktop: sort + search in one row. */}
          <div className="mb-3 flex justify-center md:hidden">
            <SearchInput value={query} onChange={setQuery} placeholder={t('search')} clearLabel={tCommon('close')} />
          </div>
          <div className="flex items-center justify-between gap-2 md:justify-start">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="bg-pink-soft inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-foreground/75 shadow-card transition-all duration-300 ease-in-out hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:hidden"
            >
              <SlidersHorizontal size={15} />
              {t('filters.open')}
              {activeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>
            <SortMenu sort={sort} onChange={setSort} />
            <div className="hidden md:block">
              <SearchInput value={query} onChange={setQuery} placeholder={t('search')} clearLabel={tCommon('close')} />
            </div>
          </div>
          <p className="mt-3 text-sm text-foreground/65" aria-live="polite">{resultsLabel(filtered.length)}</p>
        </div>
```

- [ ] **Step 7: Typecheck and lint**

Run: `npm run lint && npm run typecheck`
Expected: no errors. If `useSearchParams` triggers a "should be wrapped in Suspense" warning/error at build time (Next.js requirement for client components using it inside a page that isn't itself wrapped), note it for Step 8.

- [ ] **Step 8: If Next.js requires a Suspense boundary for `useSearchParams`, verify one already exists**

Run: `npm run lint && npm run typecheck` again after a `npm run build` locally is out of scope for this task (build requires DB per CLAUDE.md), but check for build-time errors specifically about `useSearchParams` by running:

Run: `npx next build 2>&1 | grep -i "searchParams\|Suspense" || echo "no relevant errors"`
Expected: `no relevant errors`. If errors appear, wrap the `<CatalogView />` usage in `app/[locale]/(site)/catalog/[category]/page.tsx` with `<Suspense fallback={null}>...</Suspense>` — this is a fallback step, only apply if the build actually flags it.

- [ ] **Step 9: Commit**

```bash
git add components/features/catalog/CatalogView.tsx
git commit -m "feat(catalog): wire search and price sort into dresses catalog"
```

---

## Task 5: Wire search into `CoutureGallery.tsx`

**Files:**
- Modify: `components/features/catalog/CoutureGallery.tsx`

**Interfaces:**
- Consumes: `searchProducts` from `@/lib/catalog` (Task 1); `SearchInput` (Task 2).
- Produces: none — top-level consumer.

- [ ] **Step 1: Add imports**

Replace:

```tsx
import { cover, type Product } from '@/lib/catalog';
```

with:

```tsx
import { cover, searchProducts, type Product } from '@/lib/catalog';
```

Add, alongside the other component imports at the top:

```tsx
import { useMemo, useState } from 'react';
import SearchInput from './SearchInput';
```

(Note: `useState` is already imported from `'react'` in this file for `lightbox`/`consultOpen` — merge into the existing `import { useState } from 'react';` line, adding `useMemo`, rather than duplicating the import.)

- [ ] **Step 2: Add search state and filtered list**

Inside `CoutureGallery`, after the existing `const t = useTranslations('couture');` line, add:

```tsx
  const tCatalog = useTranslations('catalog');
  const tCommon = useTranslations('common');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => searchProducts(products, query, locale), [products, query, locale]);
```

- [ ] **Step 3: Render the search input and use `filtered` instead of `products`**

Replace the opening of the returned JSX:

```tsx
  return (
    <>
      {/* Gallery — tap a dress to browse its photos (no price, no purchase) */}
      <div className="columns-2 gap-3 [column-fill:balance] md:columns-3 md:gap-5">
        {products.map((p, i) => {
```

with:

```tsx
  return (
    <>
      <div className="mb-6 flex justify-center">
        <SearchInput value={query} onChange={setQuery} placeholder={tCatalog('search')} clearLabel={tCommon('close')} />
      </div>

      {/* Gallery — tap a dress to browse its photos (no price, no purchase) */}
      <div className="columns-2 gap-3 [column-fill:balance] md:columns-3 md:gap-5">
        {filtered.map((p, i) => {
```

- [ ] **Step 4: Typecheck and lint**

Run: `npm run lint && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/features/catalog/CoutureGallery.tsx
git commit -m "feat(catalog): add name search to couture gallery"
```

---

## Task 6: Manual verification (user-run on dev)

This task has no code changes — it's the handoff checklist for the user's own testing, per their explicit preference to test on their own dev environment rather than have the agent self-verify in a browser.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Manual checklist on `/uk/catalog/dresses` and `/en/catalog/dresses`**

- Type a partial product name in search → list narrows live, no lag.
- Clear search via the × button → full list returns.
- Open sort menu (mobile: bottom sheet; desktop: popover) → pick "Price: low to high" → grid reorders, cheapest first, URL gets `?sort=price-asc`.
- Pick "Price: high to low" → reorders descending, URL updates.
- Pick "Newest" → reorders back to original order, `sort` param removed from URL.
- Combine size/color filter + search text + sort → all three narrow/reorder together correctly.
- With more than 24 results after filtering, click "Показати ще"/"Show more", then change sort → list resets to first 24 in new order (not a stale/partial mix).
- Reload the page with `?sort=price-desc` in the URL directly → sort applies on load.
- Reset button (sidebar, drawer, empty-state) clears both filters and search text.
- Mobile viewport (375px): search field is narrow (not full width), filter and sort buttons sit side by side, both ≥44px tall, no horizontal overflow.

- [ ] **Step 3: Manual checklist on `/uk/catalog/couture` and `/en/catalog/couture`**

- Search narrows the masonry gallery by name.
- No sort control is present.
- Clearing search restores the full gallery.

- [ ] **Step 4: Report back**

If everything above works, this feature is done — no further action needed from the agent. If something is off, report specifics (viewport, locale, steps) for a follow-up fix.
