'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Static-export (GitHub Pages) fallback only: there is no server to issue a
// real redirect, so replace the URL client-side after hydration.
export default function CatalogRedirectClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/catalog/dresses');
  }, [router]);

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 pt-32">
      <Link href="/catalog/dresses" className="font-sans text-sm font-semibold text-gold underline underline-offset-4">
        Основна колекція →
      </Link>
    </section>
  );
}
