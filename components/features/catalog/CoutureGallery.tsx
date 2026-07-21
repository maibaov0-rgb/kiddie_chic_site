'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, Expand, ChevronDown } from 'lucide-react';
import { cover, type Product } from '@/lib/catalog';
import { asset } from '@/lib/asset';
import PhotoLightbox from '@/components/features/reviews/PhotoLightbox';
import MessengerButtons from './MessengerButtons';

// Resolve a product's browsable photos. Falls back to the single no-image
// placeholder so a photo-less couture item still opens the lightbox.
function photosOf(p: Product): string[] {
  return p.images.length > 0 ? p.images.map(asset) : [asset(cover(p))];
}

export default function CoutureGallery({ products }: { products: Product[] }) {
  const locale = useLocale();
  const t = useTranslations('couture');
  const [lightbox, setLightbox] = useState<{ photos: string[]; name: string; index: number } | null>(null);
  const [consultOpen, setConsultOpen] = useState(false);

  const navigate = (delta: number) => {
    setLightbox((lb) =>
      lb ? { ...lb, index: (lb.index + delta + lb.photos.length) % lb.photos.length } : lb,
    );
  };

  return (
    <>
      {/* Gallery — tap a dress to browse its photos (no price, no purchase) */}
      <div className="columns-2 gap-3 [column-fill:balance] md:columns-3 md:gap-5">
        {products.map((p, i) => {
          const name = locale === 'en' ? p.name_en : p.name_uk;
          return (
            <div key={p.id} className="mb-3 break-inside-avoid md:mb-5">
              <button
                type="button"
                onClick={() => setLightbox({ photos: photosOf(p), name, index: 0 })}
                aria-label={`${name} — ${t('view')}`}
                className="group relative block w-full overflow-hidden rounded-3xl shadow-card transition-shadow duration-300 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                style={{ aspectRatio: i % 3 === 1 ? '3 / 4' : '4 / 5' }}
              >
                <Image
                  src={asset(cover(p))}
                  alt={name}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  quality={55}
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
                {/* "View photos" hint on hover/focus */}
                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="m-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 font-sans text-xs font-semibold text-foreground/80 shadow-card">
                    <Expand size={13} className="text-gold" />
                    {t('view')}
                  </span>
                </span>
              </button>
              {/* Couture catalog shows only photo + name — never a price.
                  Name styled to match the main-collection cards (ProductCard). */}
              <h3 className="mt-2.5 px-1 text-center font-sans text-sm font-bold leading-snug text-neutral-600 md:text-[15px]">
                {name}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Section CTA — reveals messengers (Viber + WhatsApp), no form modal */}
      <div className="mx-auto mt-10 flex w-full max-w-xs flex-col items-center">
        <button
          type="button"
          onClick={() => setConsultOpen((v) => !v)}
          aria-expanded={consultOpen}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-powder-200 px-8 text-sm font-semibold text-foreground/85 shadow-card transition-all duration-300 hover:bg-powder-300 hover:text-foreground hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <Sparkles size={16} />
          {t('cta')}
          <ChevronDown
            size={15}
            className={`transition-transform duration-300 ${consultOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div className="w-full">
          <MessengerButtons open={consultOpen} />
        </div>
      </div>

      <PhotoLightbox
        photos={lightbox?.photos ?? []}
        index={lightbox?.index ?? null}
        onClose={() => setLightbox(null)}
        onNavigate={navigate}
        altFor={() => lightbox?.name ?? ''}
      />
    </>
  );
}
