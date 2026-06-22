import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2 } from 'lucide-react';
import OrderRef from '@/components/features/checkout/OrderRef';
import OrderSuccessActions from '@/components/features/checkout/OrderSuccessActions';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('orderSuccess');
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default async function Page() {
  const t = await getTranslations('orderSuccess');
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center md:py-28">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/15 text-gold">
        <CheckCircle2 size={42} />
      </span>
      <h1 className="mt-6 font-sans text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {t('title')}
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-foreground/60">
        {t('message')}
      </p>

      <Suspense fallback={null}>
        <OrderRef />
      </Suspense>

      <OrderSuccessActions />
    </div>
  );
}
