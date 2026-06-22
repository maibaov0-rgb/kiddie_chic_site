'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function OrderRef() {
  const sp = useSearchParams();
  const t = useTranslations('orderSuccess');
  const ref = sp?.get('ref');
  if (!ref) return null;
  return (
    <p className="mt-5 text-sm text-foreground/60">
      {t('orderNumber')}: <span className="font-semibold text-foreground">{ref}</span>
    </p>
  );
}
