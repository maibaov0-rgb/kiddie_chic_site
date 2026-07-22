# Catalog search + price sort — design

## Context

`/catalog/dresses` and `/catalog/couture` are ISR pages (`revalidate = 300`) that fetch the
full product list for their category server-side (`getProductsByCategory`) and hand it to a
client component as a prop. The dresses catalog (`CatalogView.tsx`) already does all
filtering (size/color) client-side over that array with `useMemo` — no API route, no network
round trip. Couture (`CoutureGallery.tsx`) is a masonry photo gallery with no prices and no
filters (order-only via messenger CTA).

Prod currently has ~50 products; the existing filter UI already assumes the full category
list fits comfortably in memory and can be re-filtered per keystroke/click with no
debounce. Search and sort extend that same pattern instead of introducing a new one.

## Scope

- **Dresses catalog** (`CatalogView.tsx`): search by name + sort by price (asc/desc/default),
  combined with the existing size/color filters.
- **Couture catalog** (`CoutureGallery.tsx`): search by name only. No sort — couture has no
  prices, so "sort by price" is meaningless there.
- Both are scoped to the current category page only — no cross-category/global search.

## Data model / logic (`lib/catalog.ts`)

Add two pure functions next to the existing `filterProducts`/`minPrice`:

```ts
function searchProducts(products: Product[], query: string, locale: string): Product[]
// case-insensitive substring match against name_uk or name_en (whichever matches `locale`).
// empty/whitespace-only query returns products unchanged.

type SortOption = 'default' | 'price-asc' | 'price-desc';

function sortProducts(products: Product[], sort: SortOption): Product[]
// 'default': no-op (array is already createdAt desc from Prisma).
// 'price-asc' / 'price-desc': sorts by minPrice(product); products with no variants
// (minPrice === null) sort to the end regardless of direction.
```

Pipeline order in `CatalogView`:

```
filterProducts(sizes/colors) → searchProducts(query) → sortProducts(sort) → slice(0, visibleCount)
```

Sorting happens on the full filtered+searched array before pagination, so "Show more"
always reveals the next correctly-sorted items — never partially-sorted visible slices.

## State and URL

- `sort` is synced to the URL (`?sort=price-asc`) via `router.replace(..., { scroll: false })`
  — a single click/tap action, cheap to write, survives back/forward and is shareable.
- `query` (search text) is a local `useState`, **not** synced to the URL — avoids a
  `replaceState` call on every keystroke. Resets on navigation; acceptable tradeoff for
  simplicity given the catalog is search-scoped to the current page anyway.
- The existing pagination-reset pattern (`visibleCount` resets to `PAGE_SIZE` when `filters`
  changes, via the prev-value-during-render trick already in `CatalogView.tsx`) is extended
  to also reset on `sort` and `query` changes.

## Components

- **`SearchInput`** (`components/features/catalog/SearchInput.tsx`) — narrow input
  (`max-w-[220px]` mobile / similar constrained width desktop) with a search icon and a
  clear ("×") button. Used by both `CatalogView` and `CoutureGallery`.
- **`SortMenu`** (`components/features/catalog/SortMenu.tsx`) — pill button matching the
  existing filter-trigger button style (rounded-full, same height, icon indicating current
  direction), opening a popover (desktop) / bottom-sheet (mobile, `rounded-t-3xl`, same
  backdrop pattern as the existing filter drawer) with 3 instant-apply options: "Найновіші"
  (default), "Спочатку дешевші" (price-asc), "Спочатку дорожчі" (price-desc). Selecting an
  option applies immediately and closes the menu — no "Apply" button (unlike the multi-select
  filter drawer, these are mutually exclusive single choices). `CatalogView` only.

## Layout

**Dresses (`CatalogView.tsx`)**, below the existing category tabs (unchanged, lives in
`page.tsx`):

- **Mobile**: `SearchInput` (narrow, centered/left) → row below it: `[Filter pill][Sort pill]`
  side by side, same height/style as the current filter button → results count → grid.
- **Desktop**: left filter sidebar unchanged. Right column gets a control row above the grid:
  `[SortMenu][SearchInput]` (sort to the left of search, filters stay in the sidebar, not
  here) → results count → grid.
- Tap targets ≥44px on mobile; `SortMenu` popover/sheet uses `rounded-3xl`, backdrop-blur,
  Escape-to-close — consistent with the current filter drawer.

**Couture (`CoutureGallery.tsx`)**: only `SearchInput`, same narrow placement under the tabs,
no sort control, no filters. Filters the masonry grid by name client-side.

## Edge cases

- Filters + search + sort combine via AND — independent, composable layers.
- Products with no variants (`minPrice === null`) sort to the end in both price directions.
- Empty-result state reuses the existing empty-state block (`t('empty')` + reset button); the
  reset button now also clears `query` in addition to `filters`.
- All new labels (search placeholder, sort menu items, aria-labels) go through `next-intl`
  in both `uk` and `en` message files — no hardcoded strings.
- Accessibility: `SearchInput` has a label/`aria-label`; `SortMenu` uses
  `role="menu"`/`aria-expanded`, visible focus rings, Escape closes it — matching the
  existing filter drawer's keyboard handling.

## Verification

- `npm run lint && npm run typecheck`
- `run`/`verify` skill: real browser check at 375px and desktop — search, each sort option,
  sort+filter+search combined, pagination after sort/search change, empty-result state, both
  locales (uk/en).
