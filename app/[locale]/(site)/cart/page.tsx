import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CartView from '@/components/features/cart/CartView';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  return {
    title: t('title'),
    description: t('subtitle'),
    robots: { index: false, follow: false },
  };
}

export default async function CartPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CartView />;
}
