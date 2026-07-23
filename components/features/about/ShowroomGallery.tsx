'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { SHOWROOM_PHOTOS } from '@/lib/data/showroom-photos';
import PhotoLightbox from '@/components/features/reviews/PhotoLightbox';

export default function ShowroomGallery() {
  const t = useTranslations('about');
  const total = SHOWROOM_PHOTOS.length;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const navigate = (delta: number) => {
    setLightboxIndex((current) => {
      if (current === null) return current;
      return (current + delta + total) % total;
    });
  };

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {SHOWROOM_PHOTOS.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setLightboxIndex(i)}
            aria-label={t('showroomPhotoAlt', { n: i + 1 })}
            className="relative aspect-square overflow-hidden rounded-2xl shadow-card transition-all duration-300 ease-in-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <Image
              src={src}
              alt={t('showroomPhotoAlt', { n: i + 1 })}
              fill
              sizes="(max-width: 768px) 33vw, 220px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <PhotoLightbox
        photos={SHOWROOM_PHOTOS}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={navigate}
        altFor={(idx) => t('showroomPhotoAlt', { n: idx + 1 })}
      />
    </>
  );
}
