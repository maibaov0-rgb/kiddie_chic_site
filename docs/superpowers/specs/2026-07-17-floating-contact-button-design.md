# Floating messenger contact button — home page

## Goal
A round floating action button (FAB), bottom-right, **home page only** (`/`). On tap it expands two smaller buttons — Viber and WhatsApp — that open a direct chat with the shop.

## Scope
- Rendered only from `app/[locale]/(site)/page.tsx`. No other route.
- No new dependencies, no schema migration.

## Data source
Reuse existing `SiteSettings.viberLink` / `SiteSettings.whatsappLink` (already used by `/contacts`). Fallback phone `+380671270967` if `viberLink` unset (mirrors `/contacts` pattern), built into `viber://chat?number=...`. If both links are empty in admin, the button doesn't render at all.

To avoid forcing the home page into dynamic rendering (per CLAUDE.md — `headers()`/uncached DB reads on an ISR page silently kill SSG), the Prisma read is wrapped in `unstable_cache` (`next/cache`), tag `site-settings`, `revalidate: 300`. This is a new pattern in the repo (no prior `unstable_cache` usage) but is the standard Next.js way to read the DB from a component without opting the page out of static rendering.

## Components
- `components/features/home/FloatingContactButton.tsx` — async Server Component. Fetches settings via the cached helper, computes final viber/whatsapp URLs, returns `null` if both are empty, otherwise renders the client component with the two URLs as props.
- `components/features/home/FloatingContactButtonClient.tsx` — `'use client'`. Owns open/closed state. Renders:
  - Main circular button (`rounded-full`, gold background, `MessageCircle`/`X` icon from `lucide-react`, `shadow-float`).
  - `AnimatePresence` (framer-motion) list of two smaller circular buttons (Viber `#7360F2`, WhatsApp `#25D366`), inline SVG brand icons, stacked vertically above the main button, slide+fade in/out staggered.
  - Click-outside (or re-click main button) closes the menu.
  - Each link: `target="_blank" rel="noopener noreferrer"`, `aria-label` from new i18n keys.

## Positioning
`fixed right-6 bottom-6 md:right-8 md:bottom-8 z-50`, bottom offset padded via inline `style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}` on mobile — consistent with checkout/cart sticky bars.

## i18n
New keys under `home` namespace in `messages/uk.json` / `messages/en.json`:
- `home.contactToggle` — aria-label for main button (open/close)
- `home.contactViber` — aria-label for Viber link
- `home.contactWhatsapp` — aria-label for WhatsApp link

No visible text on the buttons (icon-only), so this is accessibility-only copy.

## Out of scope
- Not added to any other page/layout.
- No admin UI changes (fields already editable).
- No analytics/tracking.

## Testing
User will manually test on local dev server (`npm run dev`) themselves — no automated browser verification pass in this task.
