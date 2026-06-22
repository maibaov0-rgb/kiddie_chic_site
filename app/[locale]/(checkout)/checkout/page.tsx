import type { Metadata } from 'next';
import CheckoutView from '@/components/features/checkout/CheckoutView';

export const metadata: Metadata = {
  title: 'Оформлення замовлення',
  description: 'Завершіть покупку у Kiddie Chic',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CheckoutView />;
}
