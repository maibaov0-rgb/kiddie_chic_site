'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquarePlus } from 'lucide-react';
import ReviewModal from '@/components/features/reviews/ReviewModal';

export default function OrderSuccessActions() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/catalog"
          className="inline-flex h-12 items-center rounded-full bg-powder-200 px-6 text-sm font-semibold text-foreground/85 shadow-card transition-colors hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          Продовжити покупки
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-powder-200 px-6 text-sm font-semibold text-foreground/85 shadow-card transition-colors hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <MessageSquarePlus size={16} />
          Залишити відгук
        </button>
      </div>
      <ReviewModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
