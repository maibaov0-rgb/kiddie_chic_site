'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Catalog opens on the "Dresses" sub-menu by default.
// Client-side redirect so it also works under static export (GitHub Pages).
export default function CatalogIndexPage() {
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
