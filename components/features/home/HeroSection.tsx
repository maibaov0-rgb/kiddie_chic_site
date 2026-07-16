'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const EASE = [0.22, 1, 0.36, 1] as const;
// next/image applies basePath automatically, but a raw <video> src does not —
// prefix it so the hero video resolves under GitHub Pages' /repo base path.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const VIDEO_SRC = `${BASE_PATH}/videos/hero.mp4`;
const VIDEO_SRC_MOBILE = `${BASE_PATH}/videos/hero-mobile.mp4`;
const POSTER_SRC = `${BASE_PATH}/images/hero/hero-poster.jpg`;

/** Intro: doors closed → doors sliding open → final hero layout */
type Phase = 'doors' | 'reveal' | 'final';

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

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/kiddiechic.ua', Icon: InstagramIcon },
  { label: 'TikTok', href: 'https://www.tiktok.com/@kiddiechic', Icon: TikTokIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/@kiddiechic_ua', Icon: YouTubeIcon },
  { label: 'Facebook', href: 'https://www.facebook.com/161847970344500', Icon: FacebookIcon },
] as const;

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

export default function HeroSection() {
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
          <source src={VIDEO_SRC_MOBILE} media="(max-width: 768px)" />
          <source src={VIDEO_SRC} />
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
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-white/80 px-10 text-base font-semibold text-powder-300 shadow-float backdrop-blur-sm transition-all duration-300 ease-in-out hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-powder-300 focus-visible:ring-offset-2"
          >
            {!reduceMotion && (
              <motion.span
                aria-hidden
                initial={{ x: '-150%' }}
                animate={phase === 'final' ? { x: '250%' } : {}}
                transition={
                  phase === 'final'
                    ? { duration: 1.8, ease: EASE, delay: 0.9, repeat: Infinity, repeatDelay: 3 }
                    : undefined
                }
                className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white to-transparent"
              />
            )}
            <span className="relative">{t('cta')}</span>
          </Link>
        </motion.div>

        {/* Bottom bar — socials + location */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={phase === 'final' ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
          className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-5 pb-5 md:px-10 md:pb-7"
        >
          <div className="flex items-center gap-2.5">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-foreground/65 shadow-card transition-colors duration-300 hover:bg-white hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                <Icon />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
