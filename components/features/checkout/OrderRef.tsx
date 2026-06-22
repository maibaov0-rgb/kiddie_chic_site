'use client';

import { useSearchParams } from 'next/navigation';

export default function OrderRef() {
  const sp = useSearchParams();
  const ref = sp?.get('ref');
  if (!ref) return null;
  return (
    <p className="mt-5 text-sm text-foreground/60">
      Номер замовлення: <span className="font-semibold text-foreground">{ref}</span>
    </p>
  );
}
