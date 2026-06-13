import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Сукні',            href: '/catalog/dresses' },
  { label: 'Кутюрні сукні',    href: '/catalog/couture' },
  { label: 'Прикраси',         href: '/catalog/accessories' },
  { label: 'Про нас',          href: '/about' },
  { label: 'Умови замовлення', href: '/terms' },
  { label: 'Контакти',         href: '/contacts' },
];

export default function Footer() {
  return (
    <footer className="px-3 pt-2 pb-4 md:px-4 md:pb-5">
      {/* Floating card */}
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
            <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-foreground/50">
              Преміум сукні для маленьких принцес. Ручна робота, найкращі тканини, доставка по Україні.
            </p>

            {/* Socials */}
            <div className="mt-5 flex items-center gap-2">
              {[
                {
                  label: 'Instagram',
                  href: 'https://instagram.com',
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  ),
                },
                {
                  label: 'TikTok',
                  href: 'https://tiktok.com',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.76a8.18 8.18 0 0 0 4.79 1.53V6.83a4.85 4.85 0 0 1-1.02-.14z" />
                    </svg>
                  ),
                },
              ].map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-powder-100 text-foreground/50 shadow-card transition-all hover:bg-gold hover:text-white hover:shadow-float"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-5 font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/35">
              Навігація
            </h3>
            <ul className="flex flex-col gap-3">
              {FOOTER_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="font-sans text-sm text-foreground/60 transition-colors hover:text-gold"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="mb-5 font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/35">
              Контакти
            </h3>
            <div className="flex flex-col gap-3">
              <a href="tel:+380991234567" className="font-sans text-sm text-foreground/60 transition-colors hover:text-gold">
                +38 (099) 123-45-67
              </a>
              <a href="https://t.me/kiddichic" target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-foreground/60 transition-colors hover:text-gold">
                Telegram
              </a>
              <p className="font-sans text-sm leading-relaxed text-foreground/60">
                Київ, вул. Хрещатик 22<br />
                Пн–Сб 10:00–19:00
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-foreground/8 pt-8 sm:flex-row">
          <p className="font-sans text-xs text-foreground/30">
            © {new Date().getFullYear()} Kiddie Chic. Усі права захищені.
          </p>
          <div className="flex gap-5">
            <Link href="/legal/privacy" className="font-sans text-xs text-foreground/30 transition-colors hover:text-foreground/60">
              Конфіденційність
            </Link>
            <Link href="/legal/offer" className="font-sans text-xs text-foreground/30 transition-colors hover:text-foreground/60">
              Публічна оферта
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
