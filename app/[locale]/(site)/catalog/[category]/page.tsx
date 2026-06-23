import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { categoryFromSlug } from '@/lib/catalog';
import { getProductsByCategory } from '@/lib/products';
import CatalogView from '@/components/features/catalog/CatalogView';
import CoutureGallery from '@/components/features/catalog/CoutureGallery';

export const dynamic = 'force-dynamic';

type Params = { locale: string; category: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  const cat = categoryFromSlug(category);
  if (!cat) return {};

  const t = await getTranslations({ locale, namespace: 'catalog' });
  const title = cat === 'couture' ? t('couture') : t('dresses');
  const description = cat === 'couture' ? t('coutureDesc') : t('dressesDesc');
  return { title, description };
}

export default async function CatalogCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const cat = categoryFromSlug(category);

  // Only Dresses and Couture are live for now
  if (cat !== 'dress' && cat !== 'couture') notFound();

  const products = await getProductsByCategory(cat);
  const t = await getTranslations({ locale, namespace: 'catalog' });
  const tCouture = await getTranslations({ locale, namespace: 'couture' });

  const isCouture = cat === 'couture';

  const tabs = [
    { href: '/catalog/dresses', label: t('dresses'), active: !isCouture },
    { href: '/catalog/couture', label: t('couture'), active: isCouture },
  ];

  return (
    <section className="px-3 pt-28 pb-4 md:px-6 md:pt-32 md:pb-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-7 text-center md:mb-10">
          <span className="mb-3 block font-sans text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
            {t('title')}
          </span>

          {/* Sub-menu tabs */}
          <div className="inline-flex items-center gap-1 rounded-full bg-white p-1.5 shadow-card">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={tab.active ? 'page' : undefined}
                className={`rounded-full px-5 py-2.5 font-sans text-sm font-semibold transition-all duration-300 ${
                  tab.active
                    ? 'bg-powder-200 text-foreground/80 shadow-card'
                    : 'text-foreground/55 hover:text-gold'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {isCouture && (
            <p className="mx-auto mt-4 max-w-xl font-sans text-base leading-relaxed text-foreground/55">
              {tCouture('subtitle')}
            </p>
          )}
        </header>

        {isCouture ? (
          <CoutureGallery products={products} />
        ) : (
          <CatalogView products={products} />
        )}
      </div>
    </section>
  );
}
