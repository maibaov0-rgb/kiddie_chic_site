'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Check } from 'lucide-react';

export default function ConsultationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('couture.modal');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      // reset shortly after close so the success state isn't seen on reopen
      const id = setTimeout(() => {
        setSent(false);
        setName('');
        setPhone('');
      }, 300);
      return () => clearTimeout(id);
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send to Telegram admin via server action (grammy)
    setSent(true);
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-3xl bg-white p-7 shadow-float transition-all duration-300 ease-in-out md:p-8 ${
          open
            ? 'bottom-1/2 translate-y-1/2 scale-100 opacity-100'
            : 'pointer-events-none bottom-1/2 translate-y-[60%] scale-95 opacity-0'
        }`}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-powder-100 text-foreground/60 transition-colors hover:text-foreground"
        >
          <X size={18} />
        </button>

        {sent ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Check size={26} />
            </div>
            <p className="font-sans text-base font-medium text-foreground">{t('success')}</p>
          </div>
        ) : (
          <>
            <h2 className="font-sans text-xl font-semibold text-foreground md:text-2xl">{t('title')}</h2>
            <p className="mt-2 font-sans text-sm leading-relaxed text-foreground/55">{t('subtitle')}</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('name')}
                className="h-12 rounded-2xl border border-foreground/12 bg-milk px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-gold"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phone')}
                className="h-12 rounded-2xl border border-foreground/12 bg-milk px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-gold"
              />
              <button
                type="submit"
                className="mt-1 h-12 rounded-full bg-powder-200 font-sans text-sm font-semibold text-foreground/80 transition-colors hover:bg-powder-300 hover:text-foreground"
              >
                {t('submit')}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
