import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import LegalPageLayout from '@/components/features/layout/LegalPageLayout';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.terms' });
  return { title: t('title'), description: t('description') };
}

export default async function TermsPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'terms' });

  return (
    <LegalPageLayout title={t('title')}>

      <section>
        <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-widest text-gold">
          1. {t('howToOrder')}
        </h2>
        <div className="space-y-3">
          <p><strong className="text-foreground">{t('onlineSite')}:</strong> {t('onlineSiteDesc')}</p>
          <p><strong className="text-foreground">{t('processing')}:</strong> {t('processingDesc')}</p>
          <p><strong className="text-foreground">{t('confirmation')}:</strong> {t('confirmationDesc')}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-widest text-gold">
          2. {t('paymentTitle')}
        </h2>
        <div className="space-y-3">
          <p><strong className="text-foreground">{t('payOnline')}:</strong> {t('payOnlineDesc')}</p>
          <p><strong className="text-foreground">{t('payCod')}:</strong> {t('payCodDesc')}</p>
        </div>
        <p className="mt-4 rounded-2xl bg-beige-100 px-4 py-3 text-sm text-foreground/70">
          {t('payCodNote')}
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-widest text-gold">
          3. {t('delivery')}
        </h2>
        <div className="space-y-2">
          <p>{t('deliveryItem1')}</p>
          <p>{t('deliveryItem2')}</p>
          <p>{t('deliveryItem3')}</p>
          <p>{t('deliveryItem4')}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-widest text-gold">
          4. {t('receiving')}
        </h2>
        <div className="space-y-2">
          <p>{t('receivingItem1')}</p>
          <p>{t('receivingItem2')}</p>
          <p>{t('receivingItem3')}</p>
        </div>
      </section>

    </LegalPageLayout>
  );
}
