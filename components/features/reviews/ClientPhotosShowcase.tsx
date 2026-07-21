'use client';

import { useEffect, useRef, useState } from 'react';
import {
  animate as animateValue,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { CLIENT_PHOTOS } from '@/lib/data/client-photos';
import { SOCIAL_LINKS } from '@/components/ui/SocialIcons';
import PhotoLightbox from './PhotoLightbox';

interface CardDims {
  w: number;
  h: number;
  step: number;
}

const MOBILE_DIMS: CardDims = { w: 150, h: 195, step: 104 };
const DESKTOP_DIMS: CardDims = { w: 280, h: 355, step: 210 };
const VISIBLE_RANGE = 3;
const DRIFT_PX_PER_SEC = 20;

function useCardDims(): CardDims {
  const [dims, setDims] = useState<CardDims>(MOBILE_DIMS);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setDims(mq.matches ? DESKTOP_DIMS : MOBILE_DIMS);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return dims;
}

function wrapIndex(i: number, total: number) {
  return ((i % total) + total) % total;
}

function visualsFor(offsetPx: number, step: number) {
  const dist = Math.min(Math.abs(offsetPx) / step, VISIBLE_RANGE + 1);
  return {
    scale: Math.max(1 - dist * 0.2, 0.45),
    opacity: dist > VISIBLE_RANGE + 0.4 ? 0 : Math.max(1 - dist * 0.28, 0.3),
  };
}

/**
 * One photo card. It owns a fixed slot in the DOM (its index `i` never
 * changes and React never reorders it), and derives its own on-screen
 * position purely from the single shared scroll value `x` using modulo
 * wrapping — so as the carousel scrolls, each card seamlessly wraps from one
 * edge to the other without any component ever swapping places with another.
 * Because there is no React state driving position, there is nothing to fall
 * out of sync and therefore no jitter.
 */
function CarouselCard({
  i,
  src,
  x,
  span,
  dims,
  altText,
  onOpen,
  movedRef,
}: {
  i: number;
  src: string;
  x: ReturnType<typeof useMotionValue<number>>;
  span: number;
  dims: CardDims;
  altText: string;
  onOpen: (index: number) => void;
  movedRef: React.RefObject<boolean>;
}) {
  const { step } = dims;
  // Wrap the raw distance (i*step - x) into (-span/2, span/2] so the card
  // always takes the shortest way around the loop and reappears on the
  // opposite side instead of scrolling off forever.
  const cardX = useTransform(x, (xv) => {
    const raw = i * step - xv;
    let w = ((raw % span) + span) % span;
    if (w > span / 2) w -= span;
    return w;
  });
  const scale = useTransform(cardX, (v) => visualsFor(v, step).scale);
  const opacity = useTransform(cardX, (v) => visualsFor(v, step).opacity);
  const zIndex = useTransform(cardX, (v) => Math.round(1000 - Math.abs(v)));

  return (
    <motion.div
      style={{
        x: cardX,
        scale,
        opacity,
        zIndex,
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -dims.w / 2,
        marginTop: -dims.h / 2,
        width: dims.w,
        height: dims.h,
      }}
      // Any tapped card opens — center or edge. We only suppress the click
      // that follows a drag (movedRef), so a swipe never opens a photo.
      onClick={() => {
        if (!movedRef.current) onOpen(i);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(i);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={altText}
      className="cursor-pointer overflow-hidden rounded-2xl border-4 border-white bg-white shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
    >
      <Image src={src} alt={altText} fill sizes="280px" className="pointer-events-none object-cover" draggable={false} />
    </motion.div>
  );
}

/**
 * Plays once when the section scrolls into view: the visible photos fly in
 * from alternating screen edges and settle into exactly the resting
 * positions the live carousel starts from (x = 0), so the handoff to the
 * interactive carousel has no visible jump.
 */
function EntranceRow({
  photos,
  dims,
  reduceMotion,
  onDone,
}: {
  photos: string[];
  dims: CardDims;
  reduceMotion: boolean | null;
  onDone: () => void;
}) {
  const count = Math.min(VISIBLE_RANGE * 2 + 1, photos.length);
  const rels = Array.from({ length: count }, (_, i) => i - VISIBLE_RANGE);

  useEffect(() => {
    const totalMs = reduceMotion ? 0 : 600 + VISIBLE_RANGE * 110 + 200;
    const timer = setTimeout(onDone, totalMs);
    return () => clearTimeout(timer);
  }, [reduceMotion, onDone]);

  return (
    <>
      {rels.map((rel) => {
        const idx = wrapIndex(rel, photos.length);
        const src = photos[idx]!;
        const { scale, opacity } = visualsFor(rel * dims.step, dims.step);
        return (
          <motion.div
            key={src}
            initial={{
              x: rel === 0 ? 0 : rel < 0 ? -340 : 340,
              y: rel === 0 ? -30 : 16,
              rotate: rel === 0 ? 0 : rel < 0 ? -16 : 16,
              opacity: 0,
              scale: 0.6,
            }}
            animate={{ x: rel * dims.step, y: 0, rotate: 0, opacity, scale }}
            transition={{
              duration: reduceMotion ? 0 : 0.6,
              ease: 'easeOut',
              delay: reduceMotion ? 0 : Math.abs(rel) * 0.11,
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginLeft: -dims.w / 2,
              marginTop: -dims.h / 2,
              width: dims.w,
              height: dims.h,
              zIndex: 1000 - Math.abs(rel),
            }}
            className="overflow-hidden rounded-2xl border-4 border-white bg-white shadow-card"
          >
            <Image src={src} alt="" fill sizes="280px" className="object-cover" draggable={false} />
          </motion.div>
        );
      })}
    </>
  );
}

/**
 * The live carousel. A single motion value `x` is the only source of truth
 * for position — driven by a slow idle drift (rAF) and by finger/mouse pans.
 * There is no positional React state and no "rebase", which is what removes
 * the jitter/place-swapping entirely. On release it springs to the nearest
 * photo (snap), using pointer velocity for momentum.
 */
function InteractiveCarousel({
  photos,
  dims,
  onOpen,
  lightboxOpen,
  altTextFor,
}: {
  photos: string[];
  dims: CardDims;
  onOpen: (index: number) => void;
  lightboxOpen: boolean;
  altTextFor: (index: number) => string;
}) {
  const reduceMotion = useReducedMotion();
  const total = photos.length;
  const span = total * dims.step;
  const x = useMotionValue(0);

  const draggingRef = useRef(false);
  const panStartXRef = useRef(0);
  // True once a pan has moved far enough to count as a drag, so the click
  // that browsers fire after pointer-up doesn't also open the lightbox.
  const movedRef = useRef(false);
  const lightboxRef = useRef(lightboxOpen);
  useEffect(() => {
    lightboxRef.current = lightboxOpen;
  }, [lightboxOpen]);

  useAnimationFrame((_, delta) => {
    if (reduceMotion || draggingRef.current || lightboxRef.current) return;
    x.set(x.get() + DRIFT_PX_PER_SEC * (delta / 1000));
  });

  const snap = (velocityX: number) => {
    const projected = x.get() + velocityX * 0.12;
    const target = Math.round(projected / dims.step) * dims.step;
    animateValue(x, target, { type: 'spring', stiffness: 240, damping: 32 });
  };

  return (
    <motion.div
      className="relative mx-auto h-full w-full max-w-3xl cursor-grab touch-pan-y select-none active:cursor-grabbing"
      onPanStart={() => {
        draggingRef.current = true;
        movedRef.current = false;
        panStartXRef.current = x.get();
        x.stop();
      }}
      onPan={(_e: PointerEvent, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 6) movedRef.current = true;
        x.set(panStartXRef.current - info.offset.x);
      }}
      onPanEnd={(_e: PointerEvent, info: PanInfo) => {
        draggingRef.current = false;
        snap(-info.velocity.x);
        // Clear a beat later so the click event fired right after pointer-up
        // still sees movedRef === true and is suppressed.
        setTimeout(() => {
          movedRef.current = false;
        }, 0);
      }}
    >
      {photos.map((src, i) => (
        <CarouselCard
          key={src}
          i={i}
          src={src}
          x={x}
          span={span}
          dims={dims}
          altText={altTextFor(i)}
          onOpen={onOpen}
          movedRef={movedRef}
        />
      ))}
    </motion.div>
  );
}

export default function ClientPhotosShowcase() {
  const t = useTranslations('clientPhotos');
  const reduceMotion = useReducedMotion();
  const dims = useCardDims();
  const total = CLIENT_PHOTOS.length;
  const [inView, setInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const navigate = (delta: number) => {
    setLightboxIndex((current) => {
      if (current === null) return current;
      return (current + delta + total) % total;
    });
  };

  return (
    <section className="isolate overflow-hidden py-14 md:py-20" aria-labelledby="client-photos-heading">
      <div className="mb-10 px-4 text-center md:mb-14">
        <h2
          id="client-photos-heading"
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-sans text-sm font-semibold tracking-wide text-white shadow-card md:text-base"
        >
          <Camera size={16} />
          {t('title')}
        </h2>
      </div>

      <motion.div
        className="relative mx-auto"
        style={{ height: dims.h }}
        onViewportEnter={() => setInView(true)}
        viewport={{ once: true, amount: 0.4 }}
      >
        {!inView ? null : !hasEntered ? (
          <EntranceRow
            photos={CLIENT_PHOTOS}
            dims={dims}
            reduceMotion={reduceMotion}
            onDone={() => setHasEntered(true)}
          />
        ) : (
          <InteractiveCarousel
            photos={CLIENT_PHOTOS}
            dims={dims}
            lightboxOpen={lightboxIndex !== null}
            onOpen={setLightboxIndex}
            altTextFor={(idx) => t('photoAlt', { n: idx + 1 })}
          />
        )}
      </motion.div>

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
