'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { cover, type Product } from '@/lib/catalog';
import { asset } from '@/lib/asset';
import ConsultationModal from './ConsultationModal';

export default function CoutureGallery({ products }: { products: Product[] }) {
  const locale = useLocale();
  const t = useTranslations('couture');
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Gallery — photos only, no price */}
      <div className="columns-2 gap-3 [column-fill:balance] md:columns-3 md:gap-5">
        {products.map((p, i) => {
          const name = locale === 'en' ? p.name_en : p.name_uk;
          return (
            <div
              key={p.id}
              className="mb-3 break-inside-avoid md:mb-5"
            >
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="group relative block w-full overflow-hidden rounded-3xl shadow-card transition-shadow duration-300 hover:shadow-float"
                style={{ aspectRatio: i % 3 === 1 ? '3 / 4' : '4 / 5' }}
              >
                <Image
                  src={asset(cover(p))}
                  alt={name}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
                {/* Consultation overlay on hover */}
                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="m-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 font-sans text-xs font-semibold text-foreground/80 shadow-card">
                    <Sparkles size={13} className="text-gold" />
                    {t('cta')}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Section CTA */}
      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-powder-200 px-8 py-4 font-sans text-sm font-semibold text-foreground/80 shadow-card transition-all duration-300 hover:bg-powder-300 hover:text-foreground hover:shadow-float"
        >
          <Sparkles size={16} />
          {t('cta')}
        </button>
      </div>

      <ConsultationModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
