# Client Photos Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-review marquee and the "leave a review" flow with a static photo collage of 10 real customer photos, opening into a full-screen lightbox on click, with a link to social media instead of a review form.

**Architecture:** New static data file drives a mobile-grid / desktop-absolute-collage layout (`ClientPhotosShowcase`), paired with a reusable `PhotoLightbox` for full-size viewing. Old review-submission code (`ReviewModal`, `useReviewsStore`, the button in `OrderSuccessActions`) is deleted outright — nothing else references it. Social icons duplicated in `HeroSection` are extracted to a shared file so the new component can reuse them without copying SVGs.

**Tech Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · Framer Motion · next-intl · lucide-react icons.

## Global Constraints

- TS strict, no `any` (project rule).
- No hardcoded UI strings — every string through next-intl (`messages/uk.json` + `messages/en.json`, both files always edited together, uk first).
- No sharp corners: `rounded-2xl`/`rounded-3xl`/`rounded-full` only, soft `shadow-card`/`shadow-float` shadows, `transition-all duration-300 ease-in-out` on hover states.
- Mobile-first: verify layout at 375px first. Tap targets ≥ 44×44px.
- Photos referenced by string path `/images/reviews/1.jpg` … `/images/reviews/10.jpg` (not static `import`) — user drops real files into `public/images/reviews/` separately; do not add build-time existence checks.
- No test runner exists in this repo (`package.json` has no `test` script, no vitest/jest). Verification per task is `npm run lint && npm run typecheck`; there is no automated test step to write.
- **Do NOT run `git commit` at any point while executing this plan.** The user reviews and commits manually. Stage nothing automatically either — leave changes in the working tree for the user to inspect with `git status`/`git diff`.

---

### Task 1: Extract shared social icons out of `HeroSection`

**Files:**
- Create: `components/ui/SocialIcons.tsx`
- Modify: `components/features/home/HeroSection.tsx:19-59` (icon functions + `SOCIAL_LINKS` const), `:227-238` (usage — import swap only, JSX unchanged)

**Interfaces:**
- Produces: `SOCIAL_LINKS: readonly { label: string; href: string; Icon: () => JSX.Element }[]` exported from `components/ui/SocialIcons.tsx`, consumed by both `HeroSection.tsx` and `ClientPhotosShowcase.tsx` (Task 4).

- [ ] **Step 1: Create `components/ui/SocialIcons.tsx` with the icon components and link list moved verbatim from `HeroSection.tsx`**

```tsx
function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.76a8.18 8.18 0 0 0 4.79 1.53V6.83a4.85 4.85 0 0 1-1.02-.14z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/kiddiechic.ua', Icon: InstagramIcon },
  { label: 'TikTok', href: 'https://www.tiktok.com/@kiddiechic', Icon: TikTokIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/@kiddiechic_ua', Icon: YouTubeIcon },
  { label: 'Facebook', href: 'https://www.facebook.com/161847970344500', Icon: FacebookIcon },
] as const;
```

- [ ] **Step 2: In `HeroSection.tsx`, delete lines 19-59 (the four icon functions + `SOCIAL_LINKS` const) and add the import**

Replace:
```tsx
import { useTranslations } from 'next-intl';
import Link from 'next/link';
```
with:
```tsx
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { SOCIAL_LINKS } from '@/components/ui/SocialIcons';
```
Then delete the `function InstagramIcon() {...}` through `] as const;` block (old lines 19-59) — nothing else in the file references those functions directly, only `SOCIAL_LINKS` (used at old line 227), which now comes from the import.

- [ ] **Step 3: Verify**

Run: `npm run lint && npm run typecheck`
Expected: no errors. Confirm visually in `HeroSection.tsx` that `SOCIAL_LINKS.map(({ label, href, Icon }) => ...)` (bottom social bar) is untouched and still compiles against the imported constant.

---

### Task 2: Client photos data file

**Files:**
- Create: `lib/data/client-photos.ts`

**Interfaces:**
- Produces: `interface ClientPhoto { src: string; mobileRotate: number; desktop: { top: string; left: string; width: string; rotate: number; z: number } }` and `CLIENT_PHOTOS: ClientPhoto[]` (10 entries), consumed by `ClientPhotosShowcase.tsx` (Task 4) and `PhotoLightbox.tsx` (Task 3).

- [ ] **Step 1: Create the file**

```ts
export interface ClientPhoto {
  src: string;
  /** Rotation in degrees for the mobile mosaic grid tile. */
  mobileRotate: number;
  /** Absolute placement for the desktop chaotic collage. */
  desktop: {
    top: string;
    left: string;
    width: string;
    rotate: number;
    z: number;
  };
}

// Real photos live in /public/images/reviews/ (1.jpg .. 10.jpg), dropped in
// manually — not part of the code deploy. Positions below are hand-picked
// (not random) so the collage layout is stable across renders and locales.
export const CLIENT_PHOTOS: ClientPhoto[] = [
  { src: '/images/reviews/1.jpg', mobileRotate: -3, desktop: { top: '2%', left: '4%', width: '11rem', rotate: -6, z: 4 } },
  { src: '/images/reviews/2.jpg', mobileRotate: 2, desktop: { top: '6%', left: '26%', width: '9rem', rotate: 5, z: 6 } },
  { src: '/images/reviews/3.jpg', mobileRotate: -4, desktop: { top: '0%', left: '46%', width: '12rem', rotate: -3, z: 3 } },
  { src: '/images/reviews/4.jpg', mobileRotate: 3, desktop: { top: '10%', left: '68%', width: '10rem', rotate: 7, z: 5 } },
  { src: '/images/reviews/5.jpg', mobileRotate: -2, desktop: { top: '4%', left: '84%', width: '8.5rem', rotate: -8, z: 2 } },
  { src: '/images/reviews/6.jpg', mobileRotate: 4, desktop: { top: '40%', left: '8%', width: '10rem', rotate: 4, z: 7 } },
  { src: '/images/reviews/7.jpg', mobileRotate: -3, desktop: { top: '46%', left: '30%', width: '13rem', rotate: -5, z: 8 } },
  { src: '/images/reviews/8.jpg', mobileRotate: 2, desktop: { top: '42%', left: '54%', width: '9rem', rotate: 6, z: 4 } },
  { src: '/images/reviews/9.jpg', mobileRotate: -4, desktop: { top: '48%', left: '74%', width: '11rem', rotate: -4, z: 6 } },
  { src: '/images/reviews/10.jpg', mobileRotate: 3, desktop: { top: '38%', left: '88%', width: '9rem', rotate: 8, z: 3 } },
];
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: no errors (pure data file, no JSX).

---

### Task 3: `PhotoLightbox` component

**Files:**
- Create: `components/features/reviews/PhotoLightbox.tsx`

**Interfaces:**
- Consumes: `ClientPhoto` type and `CLIENT_PHOTOS` array shape from Task 2 (`{ src: string }` is all this component needs from it).
- Produces: `export default function PhotoLightbox({ photos, index, onClose, onNavigate }: { photos: { src: string }[]; index: number | null; onClose: () => void; onNavigate: (delta: number) => void }): JSX.Element` — consumed by `ClientPhotosShowcase.tsx` (Task 4).

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: { src: string }[];
  index: number | null;
  onClose: () => void;
  onNavigate: (delta: number) => void;
}) {
  const t = useTranslations('clientPhotos');
  const open = index !== null;
  const current = index !== null ? photos[index] : null;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t('photoAlt', { n: (index ?? 0) + 1 })}
        >
          <button
            type="button"
            aria-label={t('lightboxClose')}
            onClick={onClose}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-card transition-colors duration-300 hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <X size={18} />
          </button>

          <button
            type="button"
            aria-label={t('lightboxPrev')}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-card transition-colors duration-300 hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:left-6"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label={t('lightboxNext')}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(1);
            }}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-card transition-colors duration-300 hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:right-6"
          >
            <ChevronRight size={22} />
          </button>

          <motion.div
            key={current.src}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) onNavigate(1);
              else if (info.offset.x > 80) onNavigate(-1);
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="relative h-[70vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.src}
              alt={t('photoAlt', { n: (index ?? 0) + 1 })}
              fill
              sizes="(max-width: 768px) 100vw, 42rem"
              className="object-contain"
              draggable={false}
            />
          </motion.div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-foreground/70 shadow-card">
            {t('lightboxCounter', { current: (index ?? 0) + 1, total: photos.length })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npm run typecheck`
Expected: no errors. `lucide-react` (`X`, `ChevronLeft`, `ChevronRight`) is already a project dependency (used elsewhere, e.g. `ReviewsMarquee.tsx` imports from it today).

---

### Task 4: `ClientPhotosShowcase` component (replaces `ReviewsMarquee`)

**Files:**
- Create: `components/features/reviews/ClientPhotosShowcase.tsx`
- Delete: `components/features/reviews/ReviewsMarquee.tsx`

**Interfaces:**
- Consumes: `CLIENT_PHOTOS` + `ClientPhoto` from `lib/data/client-photos.ts` (Task 2), `SOCIAL_LINKS` from `components/ui/SocialIcons.tsx` (Task 1), `PhotoLightbox` default export from Task 3, i18n namespace `clientPhotos` (added in Task 7).
- Produces: `export default function ClientPhotosShowcase(): JSX.Element`, consumed by `app/[locale]/(site)/page.tsx` (Task 5).

- [ ] **Step 1: Create `components/features/reviews/ClientPhotosShowcase.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { CLIENT_PHOTOS } from '@/lib/data/client-photos';
import { SOCIAL_LINKS } from '@/components/ui/SocialIcons';
import PhotoLightbox from './PhotoLightbox';

export default function ClientPhotosShowcase() {
  const t = useTranslations('clientPhotos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const total = CLIENT_PHOTOS.length;
  const navigate = (delta: number) => {
    setLightboxIndex((current) => {
      if (current === null) return current;
      return (current + delta + total) % total;
    });
  };

  return (
    <section className="overflow-hidden py-14 md:py-20" aria-labelledby="client-photos-heading">
      <div className="mb-10 px-4 text-center md:mb-14">
        <span className="inline-flex items-center gap-2 rounded-full bg-powder-100 px-4 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          <Camera size={12} />
          {t('badge')}
        </span>
        <h2
          id="client-photos-heading"
          className="mt-4 font-sans text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          {t('title')}
        </h2>
      </div>

      {/* Mobile: mosaic grid */}
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:hidden">
        {CLIENT_PHOTOS.map((photo, idx) => (
          <motion.button
            key={photo.src}
            type="button"
            onClick={() => setLightboxIndex(idx)}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.08, ease: 'easeOut' }}
            whileTap={{ scale: 0.96, rotate: 0 }}
            style={{ rotate: photo.mobileRotate }}
            aria-label={t('photoAlt', { n: idx + 1 })}
            className="relative aspect-square overflow-hidden rounded-2xl border-4 border-white bg-white shadow-card"
          >
            <Image
              src={photo.src}
              alt={t('photoAlt', { n: idx + 1 })}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover"
            />
          </motion.button>
        ))}
      </div>

      {/* Desktop: chaotic overlapping collage */}
      <div className="relative mx-auto hidden h-[560px] max-w-5xl px-4 md:block">
        {CLIENT_PHOTOS.map((photo, idx) => (
          <motion.button
            key={photo.src}
            type="button"
            onClick={() => setLightboxIndex(idx)}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
            whileHover={{ rotate: 0, scale: 1.06, zIndex: 20 }}
            style={{
              position: 'absolute',
              top: photo.desktop.top,
              left: photo.desktop.left,
              width: photo.desktop.width,
              rotate: photo.desktop.rotate,
              zIndex: photo.desktop.z,
            }}
            aria-label={t('photoAlt', { n: idx + 1 })}
            className="aspect-square overflow-hidden rounded-2xl border-4 border-white bg-white shadow-card transition-shadow duration-300 hover:shadow-float"
          >
            <Image
              src={photo.src}
              alt={t('photoAlt', { n: idx + 1 })}
              fill
              sizes="15rem"
              className="object-cover"
            />
          </motion.button>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 px-4 text-center md:mt-14">
        <p className="text-sm font-medium text-foreground/65">{t('moreOnSocial')}</p>
        <div className="flex items-center gap-2.5">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-powder-100 text-foreground/65 shadow-card transition-colors duration-300 hover:bg-powder-200 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>

      <PhotoLightbox
        photos={CLIENT_PHOTOS}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={navigate}
      />
    </section>
  );
}
```

- [ ] **Step 2: Delete the old component**

Run: `rm components/features/reviews/ReviewsMarquee.tsx`

- [ ] **Step 3: Verify**

Run: `npm run lint && npm run typecheck`
Expected: errors about missing `clientPhotos` translation keys are type errors only if next-intl has strict message typing configured — check by running the command; if it fails solely because keys don't exist yet, that's expected until Task 7. If it fails for any other reason (typo, wrong import path), fix before moving on.

---

### Task 5: Wire the new component into the home page

**Files:**
- Modify: `app/[locale]/(site)/page.tsx:4` (import), `:26` (usage)

**Interfaces:**
- Consumes: `ClientPhotosShowcase` default export from Task 4.

- [ ] **Step 1: Swap the import and usage**

Replace:
```tsx
import ReviewsMarquee from '@/components/features/reviews/ReviewsMarquee';
```
with:
```tsx
import ClientPhotosShowcase from '@/components/features/reviews/ClientPhotosShowcase';
```

Replace:
```tsx
      <ReviewsMarquee />
```
with:
```tsx
      <ClientPhotosShowcase />
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npm run typecheck`
Expected: no errors, no remaining reference to `ReviewsMarquee` anywhere (`grep -rn "ReviewsMarquee" app components` returns nothing).

---

### Task 6: Remove the review-submission feature

**Files:**
- Delete: `components/features/reviews/ReviewModal.tsx`
- Delete: `lib/stores/reviews.ts`
- Modify: `components/features/checkout/OrderSuccessActions.tsx` (whole file rewritten, shown below)

**Interfaces:**
- None produced — this task only removes code. Confirm nothing else imports `ReviewModal` or `useReviewsStore` before deleting (`grep -rn "ReviewModal\|useReviewsStore" app components lib` should only show the files being deleted/modified here).

- [ ] **Step 1: Confirm no other consumers**

Run: `grep -rln "ReviewModal\|useReviewsStore" app components lib`
Expected output: only `components/features/reviews/ReviewModal.tsx`, `lib/stores/reviews.ts`, and `components/features/checkout/OrderSuccessActions.tsx`. If anything else shows up, stop and re-check the spec before deleting.

- [ ] **Step 2: Delete the two files**

Run:
```bash
rm components/features/reviews/ReviewModal.tsx
rm lib/stores/reviews.ts
```

- [ ] **Step 3: Rewrite `components/features/checkout/OrderSuccessActions.tsx`**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function OrderSuccessActions() {
  const t = useTranslations('orderSuccess');
  return (
    <div className="mt-10 flex justify-center">
      <Link
        href="/catalog"
        className="inline-flex h-12 items-center rounded-full bg-powder-200 px-6 text-sm font-semibold text-foreground/85 shadow-card transition-colors hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        {t('continueShopping')}
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run lint && npm run typecheck`
Expected: no errors. `grep -rn "MessageSquarePlus" components` should return nothing (that icon was only used by the removed button).

---

### Task 7: Update translation messages

**Files:**
- Modify: `messages/uk.json`
- Modify: `messages/en.json`

**Interfaces:**
- Produces: namespace `clientPhotos` with keys `badge`, `title`, `moreOnSocial`, `photoAlt`, `lightboxClose`, `lightboxPrev`, `lightboxNext`, `lightboxCounter` — consumed by `ClientPhotosShowcase.tsx` (Task 4) and `PhotoLightbox.tsx` (Task 3).

- [ ] **Step 1: In `messages/uk.json`, delete the `reviewModal` block entirely**

Remove this whole block (currently right before `reviewsMarquee`):
```json
"reviewModal": {
  "title": "Залишити відгук",
  "subtitle": "Поділіться враженнями — це допоможе іншим мамам зробити вибір",
  "rating": "Оцінка сайту",
  "ratingAria": "{n} з 5",
  "name": "Імʼя",
  "comment": "Коментар",
  "commentPlaceholder": "Що сподобалось у нашій сукні чи сервісі?",
  "submit": "Надіслати відгук"
},
```

- [ ] **Step 2: In `messages/uk.json`, replace the `reviewsMarquee` block with `clientPhotos`**

Replace:
```json
"reviewsMarquee": {
  "badge": "Відгуки",
  "title": "Відгуки наших клієнтів",
  "ratingAria": "{n} з 5"
},
```
with:
```json
"clientPhotos": {
  "badge": "Відгуки",
  "title": "Відгуки наших клієнтів",
  "moreOnSocial": "Більше відгуків — дивіться в наших соцмережах",
  "photoAlt": "Фото клієнтки Kiddie Chic {n}",
  "lightboxClose": "Закрити перегляд фото",
  "lightboxPrev": "Попереднє фото",
  "lightboxNext": "Наступне фото",
  "lightboxCounter": "{current} з {total}"
},
```

- [ ] **Step 3: In `messages/uk.json`, remove `"leaveReview": "Залишити відгук"` from the `orderSuccess` block**

Change:
```json
"orderSuccess": {
  "title": "Дякуємо за замовлення!",
  "message": "Ми отримали ваше замовлення та звʼяжемося з вами найближчим часом для підтвердження деталей.",
  "orderNumber": "Номер замовлення",
  "continueShopping": "Продовжити покупки",
  "leaveReview": "Залишити відгук"
}
```
to:
```json
"orderSuccess": {
  "title": "Дякуємо за замовлення!",
  "message": "Ми отримали ваше замовлення та звʼяжемося з вами найближчим часом для підтвердження деталей.",
  "orderNumber": "Номер замовлення",
  "continueShopping": "Продовжити покупки"
}
```

- [ ] **Step 4: Repeat steps 1-3 for `messages/en.json`**

Delete:
```json
"reviewModal": {
  "title": "Leave a review",
  "subtitle": "Share your impression — it will help other moms make a choice",
  "rating": "Site rating",
  "ratingAria": "{n} out of 5",
  "name": "Name",
  "comment": "Comment",
  "commentPlaceholder": "What did you love about our dress or service?",
  "submit": "Submit review"
},
```

Replace:
```json
"reviewsMarquee": {
  "badge": "Reviews",
  "title": "What our customers say",
  "ratingAria": "{n} out of 5"
},
```
with:
```json
"clientPhotos": {
  "badge": "Reviews",
  "title": "What our customers say",
  "moreOnSocial": "See more reviews on our social media",
  "photoAlt": "Kiddie Chic customer photo {n}",
  "lightboxClose": "Close photo view",
  "lightboxPrev": "Previous photo",
  "lightboxNext": "Next photo",
  "lightboxCounter": "{current} of {total}"
},
```

Change:
```json
"orderSuccess": {
  "title": "Thank you for your order!",
  "message": "We've received your order and will contact you shortly to confirm the details.",
  "orderNumber": "Order number",
  "continueShopping": "Continue shopping",
  "leaveReview": "Leave a review"
}
```
to:
```json
"orderSuccess": {
  "title": "Thank you for your order!",
  "message": "We've received your order and will contact you shortly to confirm the details.",
  "orderNumber": "Order number",
  "continueShopping": "Continue shopping"
}
```

- [ ] **Step 5: Validate both JSON files parse and keys match between locales**

Run:
```bash
python3 -c "
import json
uk = json.load(open('messages/uk.json'))
en = json.load(open('messages/en.json'))
assert 'reviewModal' not in uk and 'reviewModal' not in en
assert 'clientPhotos' in uk and 'clientPhotos' in en
assert set(uk['clientPhotos']) == set(en['clientPhotos'])
assert 'leaveReview' not in uk['orderSuccess'] and 'leaveReview' not in en['orderSuccess']
print('OK')
"
```
Expected: `OK` printed, no assertion errors.

- [ ] **Step 6: Verify**

Run: `npm run lint && npm run typecheck`
Expected: no errors — this should now also clear any leftover type errors from Task 4's `clientPhotos` namespace reference.

---

### Task 8: Full-project verification pass

**Files:** none (verification only).

- [ ] **Step 1: Run the project's required pre-completion checks**

Run: `npm run lint && npm run typecheck`
Expected: both pass with zero errors.

- [ ] **Step 2: Grep for dead references**

Run: `grep -rln "ReviewModal\|useReviewsStore\|ReviewsMarquee\|reviewModal\|reviewsMarquee\|leaveReview" app components lib messages`
Expected: no output (nothing left referencing the removed feature or old translation keys).

- [ ] **Step 3: Hand off to the user**

Do not run the dev server, open a browser, or commit anything. Tell the user implementation is complete per this plan and that photos still need to be placed in `public/images/reviews/1.jpg`–`10.jpg` (already created, empty) for the collage to render real images instead of broken-image icons — then they will run `npm run dev` and verify themselves.
