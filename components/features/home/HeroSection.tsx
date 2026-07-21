'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const EASE = [0.22, 1, 0.36, 1] as const;
// next/image applies basePath automatically, but a raw <video> src does not —
// prefix it so the hero video resolves under GitHub Pages' /repo base path.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const POSTER_SRC = `${BASE_PATH}/images/hero/hero-poster.jpg`;

/** Intro: doors closed → doors sliding open → final hero layout */
type Phase = 'doors' | 'reveal' | 'final';

function BrandWordmark() {
  return (
    <span className="flex flex-col items-center leading-none">
      <span
        className="whitespace-nowrap font-serif text-[clamp(2.5rem,9vw,7rem)] font-semibold tracking-widest"
        style={{
          background: 'linear-gradient(135deg, #a07040 0%, #d4a85a 45%, #c9a96e 60%, #8b6535 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        KIDDIE CHIC
      </span>
      <span className="mt-3 font-sans text-[clamp(9px,1.4vw,13px)] tracking-[0.5em] text-[#a07c5a]">
        SHOWROOM
      </span>
    </span>
  );
}

/** Full-screen powder-pink "sliding doors" with the brand name split across both halves */
function DoorsOverlay() {
  const doorBackground = 'linear-gradient(180deg, oklch(0.955 0.022 12) 0%, oklch(0.925 0.03 14) 100%)';

  const panels = [
    { side: 'left', exitX: '-100%', inner: 'left-0' },
    { side: 'right', exitX: '100%', inner: '-left-full' },
  ] as const;

  return (
    <div className="fixed inset-0 z-[60] flex" aria-hidden="true">
      {panels.map(({ side, exitX, inner }) => (
        <motion.div
          key={side}
          exit={{ x: exitX, opacity: 0 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="relative h-full w-1/2 overflow-hidden"
          style={{ background: doorBackground }}
        >
          {/* Full-viewport-wide layer clipped by the door, so the wordmark splits at the seam */}
          <div className={`absolute top-0 ${inner} flex h-full w-screen items-center justify-center`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
            >
              <BrandWordmark />
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

type HeroSectionProps = {
  videoSrc: string;
  videoSrcMobile: string;
};

export default function HeroSection({ videoSrc, videoSrcMobile }: HeroSectionProps) {
  const t = useTranslations('home.hero');
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('doors');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const revealTimer = setTimeout(() => setPhase('reveal'), reduceMotion ? 0 : 1500);
    const finalTimer = setTimeout(() => setPhase('final'), reduceMotion ? 0 : 2600);
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(finalTimer);
    };
  }, [reduceMotion]);

  // iOS blocks autoplay in Low Power Mode and is flaky even otherwise. Force a
  // muted play() on mount, and — as a fallback — start it on the very first user
  // gesture anywhere on the page (a gesture is allowed to play even in Low Power
  // Mode), so the dress video runs without the visitor tapping the play button.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    const onFirstInteract = () => tryPlay();
    window.addEventListener('touchstart', onFirstInteract, { once: true, passive: true });
    window.addEventListener('pointerdown', onFirstInteract, { once: true });
    window.addEventListener('scroll', onFirstInteract, { once: true, passive: true });
    return () => {
      window.removeEventListener('touchstart', onFirstInteract);
      window.removeEventListener('pointerdown', onFirstInteract);
      window.removeEventListener('scroll', onFirstInteract);
    };
  }, []);

  const revealed = phase !== 'doors';

  return (
    <section className="px-3 pt-24 pb-2 md:px-4 md:pt-24">
      {!reduceMotion && (
        <AnimatePresence>{phase === 'doors' && <DoorsOverlay key="doors" />}</AnimatePresence>
      )}

      {/* Full-bleed video hero card on the golden page background */}
      <div
        className="relative flex min-h-[calc(100svh-5.5rem)] flex-col items-center justify-center overflow-hidden rounded-3xl shadow-card md:min-h-[calc(100svh-7rem)] md:rounded-[2.5rem]"
        style={{ background: '#FDF8F4' }}
      >
        {/* Background video */}
        <motion.video
          ref={videoRef}
          initial={{ scale: 1.08, opacity: 0 }}
          animate={revealed ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 1.4, ease: EASE }}
          className="absolute inset-0 h-full w-full object-cover"
          poster={POSTER_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          aria-label={t('dressAlt')}
        >
          {/* Lighter encode for phones — the browser picks the first matching
              <source> at load, so this keeps mobile data usage down without JS. */}
          <source src={`${BASE_PATH}${videoSrcMobile}`} media="(max-width: 768px)" />
          <source src={`${BASE_PATH}${videoSrc}`} />
        </motion.video>

        {/* Soft scrim so the button and bottom bar stay legible over the video */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-foreground/5" />

        {/* Centered CTA */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={phase === 'final' ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          className="relative z-10"
        >
          <Link
            href="/catalog/dresses"
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-white/70 px-10 text-base font-semibold text-powder-300 shadow-float backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-powder-300 focus-visible:ring-offset-2"
          >
            {!reduceMotion && (
              <motion.span
                aria-hidden
                initial={{ x: '-150%' }}
                animate={phase === 'final' ? { x: '250%' } : {}}
                transition={
                  phase === 'final'
                    ? { duration: 3, ease: EASE, delay: 0.9, repeat: Infinity, repeatDelay: 0 }
                    : undefined
                }
                className="pointer-events-none absolute inset-y-0 left-0 w-2/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white via-50% to-transparent opacity-100 mix-blend-overlay"
              />
            )}
            <span className="relative">{t('cta')}</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
