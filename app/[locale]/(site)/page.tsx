import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HeroSection from '@/components/features/home/HeroSection';
import NewArrivals from '@/components/features/home/NewArrivals';
import AboutSection from '@/components/features/home/AboutSection';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.home');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <NewArrivals />
      <AboutSection />
    </>
  );
}
