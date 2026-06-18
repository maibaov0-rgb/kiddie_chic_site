'use client';

import { useEffect, useId, useRef, useState } from 'react';
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
  const tCommon = useTranslations('common');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const titleId = useId();
  const nameId = useId();
  const phoneId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Esc to close + auto-focus first field on open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const focusTimer = setTimeout(() => firstFieldRef.current?.focus(), 250);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
    };
  }, [open, onClose]);

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
        className={`fixed inset-0 z-[70] bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fixed left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-3xl bg-white p-7 shadow-float transition-all duration-300 ease-in-out md:p-8 ${
          open
            ? 'bottom-1/2 translate-y-1/2 scale-100 opacity-100'
            : 'pointer-events-none bottom-1/2 translate-y-[60%] scale-95 opacity-0'
        }`}
      >
        <button
          type="button"
          aria-label={tCommon('close')}
          onClick={onClose}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-powder-100 text-foreground/70 transition-colors hover:bg-powder-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <X size={18} />
        </button>

        {sent ? (
          <div className="flex flex-col items-center py-6 text-center" role="status" aria-live="polite">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Check size={26} />
            </div>
            <p className="text-base font-medium text-foreground">{t('success')}</p>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="font-serif text-xl font-semibold text-foreground md:text-2xl">{t('title')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/65">{t('subtitle')}</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={nameId} className="text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
                  {t('name')}
                </label>
                <input
                  id={nameId}
                  ref={firstFieldRef}
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-2xl border border-foreground/20 bg-milk px-4 text-base text-foreground outline-none transition-colors placeholder:text-foreground/55 focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={phoneId} className="text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
                  {t('phone')}
                </label>
                <input
                  id={phoneId}
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380…"
                  className="h-12 rounded-2xl border border-foreground/20 bg-milk px-4 text-base text-foreground outline-none transition-colors placeholder:text-foreground/55 focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <button
                type="submit"
                className="mt-2 h-12 rounded-full bg-powder-200 text-sm font-semibold uppercase tracking-wider text-foreground/85 transition-colors hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
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
