'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, MapPin, Clock } from 'lucide-react';

export default function AboutSection() {
  const t = useTranslations('home.about');

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
            <span className="mb-4 inline-flex w-fit rounded-full bg-white/60 px-4 py-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur-sm shadow-card">
              Наш бренд
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
                className="group inline-flex items-center gap-2 rounded-full bg-foreground/90 px-6 py-3 font-sans text-sm font-semibold text-white transition-all hover:bg-gold hover:shadow-card"
              >
                Дізнатись більше
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contacts"
                className="inline-flex items-center rounded-full bg-white/60 px-6 py-3 font-sans text-sm font-medium text-foreground/70 backdrop-blur-sm shadow-card transition-all hover:bg-white hover:text-gold"
              >
                Шоурум
              </Link>
            </div>
          </div>

          {/* Visual side */}
          <div className="flex flex-col gap-4">
            {/* Main photo placeholder */}
            <div
              className="relative overflow-hidden rounded-3xl shadow-float aspect-[4/3]"
              style={{ background: 'linear-gradient(150deg, oklch(0.89 0.045 10) 0%, oklch(0.84 0.060 18) 100%)' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-20 select-none">
                <span className="font-serif text-7xl font-light text-foreground/30">KC</span>
                <span className="font-sans text-[9px] tracking-[0.4em] text-foreground/25">SHOWROOM</span>
              </div>
              {/* Overlay label */}
              <div className="absolute left-4 top-4 rounded-xl bg-white/70 px-3 py-1.5 backdrop-blur-sm shadow-card">
                <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-gold">Шоурум</p>
              </div>
            </div>

            {/* Two info cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/70 px-4 py-4 backdrop-blur-sm shadow-card">
                <MapPin size={16} className="mb-2 text-gold" />
                <p className="font-sans text-xs font-semibold text-foreground">Київ</p>
                <p className="mt-0.5 font-sans text-[11px] text-foreground/50">вул. Хрещатик 22</p>
              </div>
              <div className="rounded-2xl bg-white/70 px-4 py-4 backdrop-blur-sm shadow-card">
                <Clock size={16} className="mb-2 text-gold" />
                <p className="font-sans text-xs font-semibold text-foreground">Графік</p>
                <p className="mt-0.5 font-sans text-[11px] text-foreground/50">Пн–Сб 10–19</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
