'use client';

import { useSyncExternalStore } from 'react';
import { Star, Quote } from 'lucide-react';
import { useReviewsStore } from '@/lib/stores/reviews';

export default function ReviewsMarquee() {
  // Hydration-safe — store is persisted in localStorage
  const reviews = useReviewsStore((s) => s.reviews);
  const hydrated = useSyncExternalStore(
    (cb) => useReviewsStore.persist.onFinishHydration(cb),
    () => useReviewsStore.persist.hasHydrated(),
    () => false,
  );

  // While not hydrated, render the seed reviews (initial state) — they're
  // already the default, so the SSR/CSR markup matches and there's no flash.
  const list = hydrated ? reviews : reviews;
  if (list.length === 0) return null;

  // Duplicate the list for a seamless infinite loop
  const loop = [...list, ...list];

  return (
    <section className="overflow-hidden py-14 md:py-20" aria-labelledby="reviews-heading">
      <div className="mb-10 px-4 text-center md:mb-14">
        <span className="inline-flex items-center gap-2 rounded-full bg-powder-100 px-4 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          <Star size={12} className="fill-gold" />
          Відгуки
        </span>
        <h2
          id="reviews-heading"
          className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Відгуки наших клієнтів
        </h2>
      </div>

      <div className="group relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent md:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent md:w-32" />

        <div
          className="animate-marquee flex w-max gap-4 will-change-transform md:gap-6"
          style={{ animationDuration: `${Math.max(30, list.length * 8)}s` }}
        >
          {loop.map((r, idx) => (
            <article
              key={`${r.id}-${idx}`}
              className="relative flex w-72 shrink-0 flex-col rounded-3xl bg-white p-6 shadow-card md:w-80 md:p-7"
            >
              <Quote
                size={22}
                className="absolute right-5 top-5 text-gold/30"
                aria-hidden="true"
              />
              <div className="flex gap-1" aria-label={`${r.rating} з 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={15}
                    className={n <= r.rating ? 'fill-gold text-gold' : 'text-foreground/15'}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="mt-4 line-clamp-5 text-[15px] leading-relaxed text-foreground/75">
                {r.comment}
              </p>
              <p className="mt-5 font-serif text-base font-semibold text-foreground">
                {r.name}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
