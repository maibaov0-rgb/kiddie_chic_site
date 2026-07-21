'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { ViberIcon, WhatsappIcon } from '@/components/ui/MessengerIcons';

type Props = {
  viberLink: string;
  whatsappLink: string;
};

export default function FloatingContactButtonClient({ viberLink, whatsappLink }: Props) {
  const t = useTranslations('home');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const items = [
    whatsappLink && { key: 'whatsapp', href: whatsappLink, color: '#25D366', label: t('contactWhatsapp'), icon: <WhatsappIcon /> },
    viberLink && { key: 'viber', href: viberLink, color: '#7360F2', label: t('contactViber'), icon: <ViberIcon /> },
  ].filter(Boolean) as { key: string; href: string; color: string; label: string; icon: React.ReactNode }[];

  const itemStep = 60;
  const itemStart = 68;

  return (
    <div
      ref={rootRef}
      className="fixed right-6 z-50 md:right-8"
      style={{ bottom: 'max(2.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <AnimatePresence>
          {open &&
            items.map((item, i) => (
              <motion.a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                initial={{ opacity: 0, y: 16, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.8 }}
                transition={{ duration: 0.2, delay: i * 0.05, ease: 'easeInOut' }}
                style={{ backgroundColor: item.color, bottom: itemStart + i * itemStep }}
                className="absolute right-1 flex h-12 w-12 items-center justify-center rounded-full shadow-float transition-transform duration-300 ease-in-out hover:scale-105"
              >
                {item.icon}
              </motion.a>
            ))}
        </AnimatePresence>

        <AnimatePresence>
          {!open && (
            <motion.span
              key="ring"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-powder-300"
              initial={{ scale: 1, opacity: 0.35 }}
              animate={{ scale: 1.45, opacity: 0, transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
            />
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={t('contactToggle')}
          aria-expanded={open}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={open ? { scale: 1 } : { scale: [1, 1.06, 1] }}
          transition={open ? { duration: 0.15 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-powder-300 text-white shadow-float"
        >
          <span className="flex">{open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}</span>
        </motion.button>
      </div>
    </div>
  );
}
