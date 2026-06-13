import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HeroSection from '@/components/features/home/HeroSection';
import NewArrivals from '@/components/features/home/NewArrivals';
import AboutSection from '@/components/features/home/AboutSection';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.home' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function HomePage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <NewArrivals />
      <AboutSection />
    </>
  );
}
