'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Star, X, Check } from 'lucide-react';
import { useReviewsStore } from '@/lib/stores/reviews';

export default function ReviewModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addReview = useReviewsStore((s) => s.addReview);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [sent, setSent] = useState(false);
  const titleId = useId();
  const nameId = useId();
  const commentId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Esc + autofocus
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 250);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  // Reset shortly after close
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setSent(false);
      setName('');
      setComment('');
      setRating(5);
      setHover(0);
    }, 300);
    return () => clearTimeout(t);
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !comment.trim() || rating < 1) return;
    addReview({ name: name.trim(), comment: comment.trim(), rating });
    setSent(true);
  }

  const valid = name.trim().length >= 2 && comment.trim().length >= 5 && rating >= 1;

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
          aria-label="Закрити"
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
            <p className="text-base font-medium text-foreground">Дякуємо за відгук!</p>
            <p className="mt-1 text-sm text-foreground/55">
              Ваші слова надихають нас працювати ще краще
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-foreground/90 px-6 text-sm font-semibold text-white transition-colors hover:bg-gold"
            >
              Закрити
            </button>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="font-serif text-xl font-semibold text-foreground md:text-2xl">
              Залишити відгук
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">
              Поділіться враженнями — це допоможе іншим мамам зробити вибір
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              {/* Rating */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
                  Оцінка сайту <span className="text-gold">*</span>
                </span>
                <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = (hover || rating) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        aria-label={`${n} з 5`}
                        aria-pressed={rating === n}
                        className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-powder-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                      >
                        <Star
                          size={26}
                          className={active ? 'fill-gold text-gold' : 'text-foreground/25'}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor={nameId} className="text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
                  Імʼя <span className="text-gold">*</span>
                </label>
                <input
                  id={nameId}
                  ref={firstFieldRef}
                  type="text"
                  required
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-2xl border border-foreground/20 bg-milk px-4 text-base text-foreground outline-none transition-colors placeholder:text-foreground/55 focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>

              {/* Comment */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor={commentId} className="text-[12px] font-semibold uppercase tracking-wider text-foreground/65">
                  Коментар <span className="text-gold">*</span>
                </label>
                <textarea
                  id={commentId}
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Що сподобалось у нашій сукні чи сервісі?"
                  className="resize-none rounded-2xl border border-foreground/20 bg-milk px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground/45 focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>

              <button
                type="submit"
                disabled={!valid}
                className="mt-2 h-12 rounded-full bg-foreground/90 text-sm font-semibold text-white transition-colors hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Надіслати відгук
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
