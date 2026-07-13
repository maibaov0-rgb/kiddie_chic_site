import { redirect } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';
import CatalogRedirectClient from './redirect-client';

// Catalog opens on the "Dresses" sub-menu by default. The full-stack app
// redirects on the server (baked into the prerendered page, so navigations
// resolve it without an extra client round-trip); redirect() is unsupported
// under static export, so the GitHub Pages demo keeps the client-side one.
const isStatic = process.env.STATIC_EXPORT === 'true';

export default async function CatalogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!isStatic) {
    redirect({ href: '/catalog/dresses', locale });
  }

  return <CatalogRedirectClient />;
}
