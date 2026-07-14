import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/features/layout/Header';
import Footer from '@/components/features/layout/Footer';

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Without this, Footer's useTranslations falls back to reading the locale
  // from headers(), which silently turns every (site) page dynamic and
  // disables ISR — the whole site then SSRs on each request.
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
