'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function OrderSuccessActions() {
  const t = useTranslations('orderSuccess');
  return (
    <div className="mt-10 flex justify-center">
      <Link
        href="/catalog"
        className="inline-flex h-12 items-center rounded-full bg-powder-200 px-6 text-sm font-semibold text-foreground/85 shadow-card transition-colors hover:bg-powder-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        {t('continueShopping')}
      </Link>
    </div>
  );
}
