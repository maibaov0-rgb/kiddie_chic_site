import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { routing } from '@/i18n/routing';

// Needs the database, which the CI image build has no access to — must
// render at request time on the VPS, not at build time (same reasoning as
// contacts/page.tsx: export const dynamic = 'force-dynamic').
export const dynamic = 'force-dynamic';

const CATEGORY_TO_SLUG = {
  dress: 'dresses',
  couture: 'couture',
  accessory: 'accessories',
} as const;

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://kiddiechic.ua').replace(/\/$/, '');

function localizedUrls(path: string) {
  return Object.fromEntries(
    routing.locales.map((locale) => [
      locale,
      `${SITE_URL}${locale === routing.defaultLocale ? '' : `/${locale}`}${path}`,
    ]),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { isHidden: false },
    select: { slug: true, category: true, updatedAt: true },
  });

  const staticPaths = ['', '/catalog/dresses', '/catalog/couture', '/catalog/accessories'];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    alternates: { languages: localizedUrls(path) },
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => {
    const path = `/catalog/${CATEGORY_TO_SLUG[p.category]}/${p.slug}`;
    return {
      url: `${SITE_URL}${path}`,
      lastModified: p.updatedAt,
      alternates: { languages: localizedUrls(path) },
    };
  });

  return [...staticEntries, ...productEntries];
}
