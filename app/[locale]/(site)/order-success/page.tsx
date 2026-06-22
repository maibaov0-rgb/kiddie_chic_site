import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';
import OrderRef from '@/components/features/checkout/OrderRef';
import OrderSuccessActions from '@/components/features/checkout/OrderSuccessActions';

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

      <OrderSuccessActions />
    </div>
  );
}
