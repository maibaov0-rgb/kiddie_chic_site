'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { MESSENGERS } from '@/lib/contact';
import { MESSENGER_ICONS } from '@/components/ui/MessengerIcons';

/**
 * The revealing Viber + WhatsApp choices shared by the product page and the
 * couture section. The trigger button (with its own styling) lives in each
 * caller; this only renders the two messenger buttons that expand when `open`.
 */
export default function MessengerButtons({ open }: { open: boolean }) {
  const th = useTranslations('home');
  const labelFor: Record<string, string> = {
    viber: th('contactViber'),
    whatsapp: th('contactWhatsapp'),
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {MESSENGERS.map((m, i) => {
              const Icon = MESSENGER_ICONS[m.key];
              return (
                <motion.a
                  key={m.key}
                  href={m.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={labelFor[m.key]}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: 0.05 + i * 0.06 }}
                  style={{ backgroundColor: m.color }}
                  className="flex items-center justify-center gap-2 rounded-full px-4 py-3 font-sans text-sm font-semibold text-white shadow-card transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                >
                  <Icon className="h-5 w-5" />
                  {m.name}
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
