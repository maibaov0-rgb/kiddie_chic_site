import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ChevronRight } from 'lucide-react';
import { getProductBySlug, getProductsByCategory, cover } from '@/lib/catalog';
import ProductDetail from '@/components/features/catalog/ProductDetail';

type Params = { locale: string; category: string; slug: string };

// Static export: pre-render a detail page for every dress
export function generateStaticParams() {
  return getProductsByCategory('dress').map((p) => ({ category: 'dresses', slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const en = locale === 'en';
  return {
    title: en ? product.name_en : product.name_uk,
    description: en ? product.description_en : product.description_uk,
    openGraph: { images: [cover(product)] },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = getProductBySlug(slug);

  // Couture has no purchasable detail page — only the gallery + consultation
  if (!product || product.category !== 'dress') notFound();

  const en = locale === 'en';

  return (
    <section className="px-3 pt-28 pb-6 md:px-6 md:pt-32 md:pb-12">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 font-sans text-xs text-foreground/40 md:mb-8">
          <Link href="/catalog/dresses" className="transition-colors hover:text-gold">
            {en ? 'Dresses' : 'Сукні'}
          </Link>
          <ChevronRight size={13} />
          <span className="text-foreground/60">{en ? product.name_en : product.name_uk}</span>
        </nav>

        <ProductDetail product={product} />
      </div>
    </section>
  );
}
