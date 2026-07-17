'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

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

function ViberIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12.1 2c-1.9 0-6.9.5-9.4 3.7-1.9 2.5-1.5 5.7-1.1 7.4.3 1.3 1.2 3 2.8 4.3-.1.8-.4 2.4-.5 3.4-.1.6.6 1 1.1.6 1-.7 2.5-1.8 3.3-2.4.7.1 1.4.2 2.1.2 1.9 0 6.9-.5 9.4-3.7 1.9-2.5 1.5-5.7 1.1-7.4-.4-1.7-1.9-4-4-5.2C15.3 2.3 13.7 2 12.1 2Zm.1 1.6c1.4 0 2.7.3 3.9 1 1.7 1 3 3 3.3 4.3.3 1.4.6 3.9-.9 5.9-2.1 2.7-6.3 3.1-8.1 3.1-.8 0-1.6-.1-2.3-.3l-.5-.1-.4.3c-.5.4-1.3 1-2 1.5.1-.6.2-1.4.3-1.9l.1-.7-.6-.5c-1.3-1.1-2-2.5-2.3-3.5-.4-1.5-.7-4 .9-6C6.2 4 10.7 3.6 12.2 3.6Zm-.2 2.6c-.3 0-.6.3-.6.6s.3.6.6.6c1.6 0 3.1.6 4.2 1.7 1.1 1.1 1.7 2.6 1.7 4.2 0 .3.3.6.6.6s.6-.3.6-.6c0-1.9-.8-3.7-2.1-5-1.3-1.4-3.1-2.1-5-2.1Zm.2 2.1c-.3 0-.6.3-.6.6s.3.6.6.6c.9 0 1.7.3 2.3.9.6.6.9 1.4.9 2.3 0 .3.3.6.6.6s.6-.3.6-.6c0-1.2-.5-2.4-1.4-3.2-.8-.8-2-1.2-3-1.2Zm-.1 2.2c-.3 0-.5.2-.5.5s.2.5.5.5c.4 0 .8.2 1.1.5.3.3.4.6.5 1 0 .3.2.5.5.5s.5-.2.5-.5c0-.6-.3-1.2-.7-1.6-.5-.5-1.1-.9-1.9-.9Z"
        fill="#fff"
      />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4C8.6 21.5 10.3 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2Zm0 18.3c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3C4 15 3.6 13.5 3.6 12c0-4.6 3.8-8.4 8.4-8.4s8.4 3.8 8.4 8.4-3.8 8.3-8.4 8.3Zm4.6-6.2c-.2-.1-1.5-.8-1.8-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.5-1 .2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z"
        fill="#fff"
      />
    </svg>
  );
}
