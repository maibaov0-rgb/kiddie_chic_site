'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackMetaPixel } from '@/lib/meta-pixel';

// Runs on the Hutko payment-return page. Guards against double-firing on a
// page refresh (or the redirect landing twice) by remembering the order ref
// that already fired the Purchase event for this browser session.
export default function PurchaseTracker() {
  const sp = useSearchParams();

  useEffect(() => {
    const ref = sp?.get('ref');
    const value = sp?.get('value');
    const currency = sp?.get('currency') ?? 'UAH';
    if (!ref) return;

    const dedupeKey = `metaPixelPurchase:${ref}`;
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, '1');

    trackMetaPixel('Purchase', {
      content_ids: [ref],
      value: value ? Number(value) : undefined,
      currency,
    });
  }, [sp]);

  return null;
}
