import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HeroSection from '@/components/features/home/HeroSection';
import ClientPhotosShowcase from '@/components/features/reviews/ClientPhotosShowcase';
import AboutSection from '@/components/features/home/AboutSection';
import FloatingContactButton from '@/components/features/home/FloatingContactButton';
import { versionedAssetUrl } from '@/lib/asset-version';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.home' });
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { images: [versionedAssetUrl('/images/hero/og-image.jpg')] },
  };
}

export default async function HomePage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection
        videoSrc={versionedAssetUrl('/videos/hero.mp4')}
        videoSrcMobile={versionedAssetUrl('/videos/hero-mobile.mp4')}
      />
      <ClientPhotosShowcase />
      <AboutSection />
      <FloatingContactButton />
    </>
  );
}
