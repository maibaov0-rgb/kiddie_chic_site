'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, MapPin, Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const SHOWROOM_QUERY = 'вул. Саксаганського 63/28, Київ, 01033';

export default function AboutSection() {
  const t = useTranslations('home.about');
  const locale = useLocale();
  const MAP_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(SHOWROOM_QUERY)}&z=16&hl=${locale === 'en' ? 'en' : 'uk'}&output=embed`;

  return (
    <section className="px-3 py-2 md:px-4">
      {/* Floating card */}
      <div
        className="relative overflow-hidden rounded-3xl px-5 py-10 shadow-card md:rounded-[2.5rem] md:px-12 md:py-14"
        style={{
          background: 'linear-gradient(145deg, oklch(0.95 0.022 20) 0%, oklch(0.94 0.028 30) 50%, oklch(0.93 0.025 50) 100%)',
        }}
      >
        {/* Background blobs */}
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-100/30 blur-3xl" />
        <div className="absolute -bottom-10 left-10 h-48 w-48 rounded-full bg-powder-100/50 blur-2xl" />

        <div className="relative z-10 grid gap-10 md:grid-cols-2 md:gap-16">

          {/* Text side */}
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit rounded-full bg-white/80 px-4 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold shadow-card">
              {t('badge')}
            </span>
            <h2 className="font-sans text-3xl font-semibold leading-snug tracking-tight text-foreground md:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-5 font-sans text-base leading-relaxed text-foreground/60 md:text-[17px]">
              {t('body')}
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground/90 px-6 text-sm font-semibold text-white transition-all hover:bg-gold hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {t('learnMore')}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contacts"
                className="inline-flex min-h-11 items-center rounded-full bg-white/80 px-6 text-sm font-medium text-foreground/75 shadow-card transition-all hover:bg-white hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                {t('showroom')}
              </Link>
            </div>
          </div>

          {/* Visual side — showroom map + details */}
          <div className="flex flex-col gap-4">
            {/* Google map */}
            <div className="relative overflow-hidden rounded-3xl shadow-float aspect-[4/3]">
              <iframe
                title={t('mapTitle')}
                src={MAP_SRC}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              {/* Overlay label */}
              <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-1.5 shadow-card">
                <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-gold">{t('mapPin')}</p>
              </div>
            </div>

            {/* Two info cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/85 px-4 py-4 shadow-card">
                <MapPin size={16} className="mb-2 text-gold" />
                <p className="font-sans text-xs font-semibold text-foreground">{t('showroomCity')}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/65">
                  {t('showroomAddress')}<br />{t('showroomCityLine')}
                </p>
              </div>
              <div className="rounded-2xl bg-white/85 px-4 py-4 shadow-card">
                <Clock size={16} className="mb-2 text-gold" />
                <p className="font-sans text-xs font-semibold text-foreground">{t('hoursTitle')}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-foreground/65">
                  {t('hoursLine1')}<br />{t('hoursLine2')}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
