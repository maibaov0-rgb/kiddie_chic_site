import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { prisma } from '@/lib/prisma';

// Reads SiteSettings from the DB — must stay dynamic: the CI image build has
// no database, so this page cannot be prerendered at build time.
export const dynamic = 'force-dynamic';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.contacts' });
  return { title: t('title'), description: t('description') };
}

async function getSettings() {
  return prisma.siteSettings.findUnique({ where: { id: 1 } });
}

export default async function ContactsPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'contacts' }),
    getSettings(),
  ]);

  const phone = settings?.phone || '+380671270967';
  const email = settings?.email || 'kiddiechic.ua@gmail.com';
  const address = settings?.showroomAddress || 'вул. Саксаганського 63/28, 01033, Київ';
  const telegram = settings?.telegramLink;
  const whatsapp = settings?.whatsappLink;
  const viber = settings?.viberLink;
  const instagram = settings?.instagramLink;

  return (
    <div className="min-h-screen bg-milk">
      <div className="relative overflow-hidden bg-gradient-to-b from-powder-100 to-milk px-4 pb-12 pt-28 text-center md:pb-16 md:pt-36">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #F4C6C6 0%, transparent 50%), radial-gradient(circle at 70% 20%, #EDE0D4 0%, transparent 40%)' }}
        />
        <div className="relative mx-auto max-w-2xl">
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('title')}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">

          {/* Contact info card */}
          <div className="rounded-3xl bg-white p-6 shadow-card md:p-8">
            <h2 className="mb-6 font-sans text-sm font-bold uppercase tracking-widest text-gold">
              {t('info')}
            </h2>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-beige-100">
                  <Phone className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    {t('phone')}
                  </p>
                  <a
                    href={`tel:+${phone.replace(/\D/g, '')}`}
                    className="text-base font-medium text-foreground transition-colors hover:text-gold"
                  >
                    {phone}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-beige-100">
                  <Mail className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    {t('email')}
                  </p>
                  <a
                    href={`mailto:${email}`}
                    className="text-base font-medium text-foreground transition-colors hover:text-gold"
                  >
                    {email}
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-beige-100">
                  <MapPin className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    {t('address')}
                  </p>
                  <p className="text-base font-medium text-foreground">{address}</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-beige-100">
                  <Clock className="h-4 w-4 text-gold" />
                </span>
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    {t('schedule')}
                  </p>
                  <p className="text-base font-medium text-foreground">{t('scheduleValue')}</p>
                </div>
              </li>
            </ul>

            {/* Messengers */}
            {(telegram || whatsapp || viber || instagram) && (
              <div className="mt-8">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  {t('messengers')}
                </p>
                <div className="flex flex-wrap gap-3">
                  {telegram && (
                    <a
                      href={telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#229ED9]/10 px-4 py-2 text-sm font-medium text-[#229ED9] transition-colors hover:bg-[#229ED9]/20"
                    >
                      Telegram
                    </a>
                  )}
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20"
                    >
                      WhatsApp
                    </a>
                  )}
                  {viber && (
                    <a
                      href={viber}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#7360F2]/10 px-4 py-2 text-sm font-medium text-[#7360F2] transition-colors hover:bg-[#7360F2]/20"
                    >
                      Viber
                    </a>
                  )}
                  {instagram && (
                    <a
                      href={instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-powder-100 px-4 py-2 text-sm font-medium text-powder-300 transition-colors hover:bg-powder-200"
                    >
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="overflow-hidden rounded-3xl shadow-card">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2540.8!2d30.5160!3d50.4420!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d4cf5b8b1f0a0b%3A0x0!2z0LLRg9C7LiDQodCw0LrRgdCw0LPQsNC90YHRjNC60L7Qs9C-IDYzLzI4LCDQmtC40ZfQsg!5e0!3m2!1suk!2sua!4v1720600000000"
              width="100%"
              height="100%"
              style={{ minHeight: '320px', border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t('mapTitle')}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
