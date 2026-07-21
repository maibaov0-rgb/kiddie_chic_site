'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Hand } from 'lucide-react';

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 320 : -320, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -320 : 320, opacity: 0 }),
};

/** Mobile-only "you can swipe" hint — same waving hand used on the product
 * gallery. Manages its own visibility so no parent state is set during
 * render; auto-hides after a moment or on the first pointer interaction. */
function SwipeHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = () => setVisible(false);
    const id = setTimeout(hide, 1800);
    window.addEventListener('pointerdown', hide, { once: true });
    return () => {
      clearTimeout(id);
      window.removeEventListener('pointerdown', hide);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center md:hidden"
        >
          <motion.div
            animate={{ x: [-18, 18, -18] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/85 shadow-float"
          >
            <Hand size={22} className="text-powder-300" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
  altFor,
}: {
  photos: string[];
  index: number | null;
  onClose: () => void;
  onNavigate: (delta: number) => void;
  // Optional override for the photo's alt / dialog label. Defaults to the
  // reviews wording; couture passes the dress name instead.
  altFor?: (index: number) => string;
}) {
  const t = useTranslations('clientPhotos');
  const open = index !== null;
  const current = index !== null ? photos[index] : null;
  const alt = altFor ? altFor(index ?? 0) : t('photoAlt', { n: (index ?? 0) + 1 });
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        setDirection(-1);
        onNavigate(-1);
      }
      if (e.key === 'ArrowRight') {
        setDirection(1);
        onNavigate(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, onNavigate]);

  // Server render has no document; the portal is client-only. The component
  // renders nothing in its own tree either way, so there is no hydration
  // mismatch to worry about.
  if (typeof document === 'undefined') return null;

  // Rendered through a portal onto <body> so it escapes the showcase
  // section's `isolate` stacking context — otherwise the carousel cards
  // (which carry a high z-index for their coverflow depth) would paint on
  // top of the backdrop.
  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-milk p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            aria-label={t('lightboxClose')}
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-powder-100 text-powder-300 shadow-card transition-colors duration-300 hover:bg-powder-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            <X size={18} />
          </button>

          {/* Arrows are desktop-only (same round powder style as the catalog
              product gallery); on mobile you swipe the photo instead. */}
          <button
            type="button"
            aria-label={t('lightboxPrev')}
            onClick={(e) => {
              e.stopPropagation();
              setDirection(-1);
              onNavigate(-1);
            }}
            className="absolute left-6 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-powder-100 text-powder-300 shadow-card transition-colors duration-300 hover:bg-powder-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:flex"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label={t('lightboxNext')}
            onClick={(e) => {
              e.stopPropagation();
              setDirection(1);
              onNavigate(1);
            }}
            className="absolute right-6 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-powder-100 text-powder-300 shadow-card transition-colors duration-300 hover:bg-powder-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 md:flex"
          >
            <ChevronRight size={22} />
          </button>

          {/* Fixed-size stage; the photo slides within it. Sized smaller than
              the viewport so there's always tappable backdrop around it. */}
          <div
            className="relative h-[65vh] w-[80vw] max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: 'spring', stiffness: 300, damping: 32 }, opacity: { duration: 0.2 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(_, info) => {
                  // React to a quick flick (velocity) as well as distance, so a
                  // short fast swipe still turns the page — feels more responsive.
                  const { x: offsetX } = info.offset;
                  const { x: velocityX } = info.velocity;
                  if (offsetX < -70 || velocityX < -450) {
                    setDirection(1);
                    onNavigate(1);
                  } else if (offsetX > 70 || velocityX > 450) {
                    setDirection(-1);
                    onNavigate(-1);
                  }
                }}
                className="absolute inset-0"
              >
                <Image
                  src={current}
                  alt={alt}
                  fill
                  sizes="(max-width: 768px) 80vw, 28rem"
                  className="rounded-3xl object-cover shadow-float"
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            <SwipeHint />
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-powder-100 px-4 py-1.5 text-xs font-semibold text-foreground/70 shadow-card">
            {t('lightboxCounter', { current: (index ?? 0) + 1, total: photos.length })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
