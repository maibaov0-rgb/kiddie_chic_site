'use client';

import { useSearchParams } from 'next/navigation';
import { Package } from 'lucide-react';

export default function OrderRef() {
  const sp = useSearchParams();
  const ref = sp?.get('ref');
  if (!ref) return null;
  return (
    <div className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-powder-100 px-5 py-3">
      <Package size={18} className="text-gold" />
      <span className="text-sm text-foreground/65">Номер замовлення:</span>
      <span className="font-mono text-sm font-bold text-foreground">{ref}</span>
    </div>
  );
}
