import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';
import OrderRef from '@/components/features/checkout/OrderRef';

export const metadata: Metadata = {
  title: 'Дякуємо за замовлення',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center md:py-28">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-gold">
        <CheckCircle2 size={42} />
      </span>
      <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        Дякуємо за замовлення!
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-foreground/60">
        Ми отримали ваше замовлення та зв&apos;яжемося з вами найближчим часом
        для підтвердження деталей.
      </p>

      <Suspense fallback={null}>
        <OrderRef />
      </Suspense>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/catalog"
          className="inline-flex h-12 items-center rounded-full bg-foreground/90 px-6 text-sm font-semibold text-white transition-colors hover:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          Продовжити покупки
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-medium text-foreground/70 shadow-card transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          На головну
        </Link>
      </div>
    </div>
  );
}
