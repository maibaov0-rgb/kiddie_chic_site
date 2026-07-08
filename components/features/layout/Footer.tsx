import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const FOOTER_LINKS = [
  { key: 'linkDresses',     href: '/catalog/dresses' },
  { key: 'linkCouture',     href: '/catalog/couture' },
  { key: 'linkAccessories', href: '/catalog/accessories' },
  { key: 'linkAbout',       href: '/about' },
  { key: 'linkTerms',       href: '/terms' },
  { key: 'linkContacts',    href: '/contacts' },
] as const;

export default function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="px-3 pt-2 pb-4 md:px-4 md:pb-5">
      <div className="rounded-3xl bg-white px-5 py-10 shadow-card md:rounded-[2.5rem] md:px-10 md:py-12">
        <div className="grid gap-10 md:grid-cols-3">

          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex flex-col items-start leading-none">
              <span
                className="font-serif text-xl font-semibold tracking-widest"
                style={{
                  background: 'linear-gradient(135deg, #a07040 0%, #d4a85a 45%, #c9a96e 60%, #8b6535 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                KIDDIE CHIC
              </span>
              <span className="mt-0.5 font-sans text-[8px] tracking-[0.35em] text-powder-300">SHOWROOM</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/65">
              {t('tagline')}
            </p>

          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/60">
              {t('navTitle')}
            </h3>
            <ul className="flex flex-col gap-3">
              {FOOTER_LINKS.map(({ key, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-foreground/70 transition-colors hover:text-gold focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Address */}
          <div>
            <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/60">
              {t('contactsTitle')}
            </h3>
            <p className="text-sm leading-relaxed text-foreground/65">
              {t('city')}<br />
              {t('address')}<br />
              {t('hours')}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-foreground/10 pt-8 sm:flex-row">
          <p className="text-xs text-foreground/60">
            © {new Date().getFullYear()} Kiddie Chic. {t('rights')}
          </p>
          <div className="flex gap-5">
            <Link href="/legal/privacy" className="text-xs text-foreground/60 transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
              {t('privacy')}
            </Link>
            <Link href="/legal/offer" className="text-xs text-foreground/60 transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
              {t('offer')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
