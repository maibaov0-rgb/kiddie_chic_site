import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Heart, Star, Sparkles } from 'lucide-react';
import ShowroomGallery from '@/components/features/about/ShowroomGallery';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.about' });
  return { title: t('title'), description: t('description') };
}

export default async function AboutPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  const values = [
    { icon: Star, titleKey: 'value1Title', textKey: 'value1Text' },
    { icon: Heart, titleKey: 'value2Title', textKey: 'value2Text' },
    { icon: Sparkles, titleKey: 'value3Title', textKey: 'value3Text' },
  ] as const;

  return (
    <div className="min-h-screen bg-milk">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-powder-100 to-milk px-4 pb-16 pt-28 text-center md:pb-24 md:pt-36">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #F4C6C6 0%, transparent 50%), radial-gradient(circle at 70% 20%, #EDE0D4 0%, transparent 40%)' }}
        />
        <div className="relative mx-auto max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold">Kiddie Chic Showroom</p>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('heroTitle')}
          </h1>
        </div>
      </div>

      {/* Story */}
      <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
        <div className="space-y-5 text-base leading-relaxed text-foreground/70">
          <p>{t('storyP1')}</p>
          <p>{t('storyP2')}</p>
          <p>{t('storyP3')}</p>
          <p>{t('storyP4')}</p>
          <p>{t('storyP5')}</p>
        </div>
      </div>

      {/* Values */}
      <div className="bg-white px-4 py-14 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('valuesTitle')}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map(({ icon: Icon, titleKey, textKey }) => (
              <div key={titleKey} className="rounded-3xl bg-milk p-7 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-powder-100">
                  <Icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-foreground">
                  {t(titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/65">{t(textKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Showroom */}
      <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
        <div className="rounded-3xl bg-white p-8 shadow-card md:p-12">
          <h2 className="mb-4 font-sans text-2xl font-semibold tracking-tight text-foreground">
            {t('showroomTitle')}
          </h2>
          <p className="mb-6 text-base leading-relaxed text-foreground/70">{t('showroomText')}</p>
          <div className="space-y-2 text-sm text-foreground/60">
            <p>📍 {t('showroomAddress')}</p>
            <p>🕐 {t('showroomHours')}</p>
          </div>
          <ShowroomGallery />
        </div>
      </div>
    </div>
  );
}
