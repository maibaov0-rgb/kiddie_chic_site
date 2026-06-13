'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShoppingBag, Menu, X, Search } from 'lucide-react';

const NAV_LINKS = [
  { key: 'catalog',  href: '/catalog' },
  { key: 'terms',    href: '/terms' },
  { key: 'about',    href: '/about' },
  { key: 'contacts', href: '/contacts' },
] as const;

const GoldLogo = ({ size = 'md' }: { size?: 'md' | 'lg' }) => (
  <Link href="/" className="flex flex-col items-start leading-none">
    <span
      className={size === 'lg' ? 'font-serif text-2xl font-semibold tracking-widest' : 'font-serif text-lg font-semibold tracking-widest'}
      style={{
        background: 'linear-gradient(135deg, #a07040 0%, #d4a85a 45%, #c9a96e 60%, #8b6535 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      KIDDIE CHIC
    </span>
    <span className="font-sans text-[8px] tracking-[0.35em] text-powder-300 mt-0.5">
      SHOWROOM
    </span>
  </Link>
);

export default function Header() {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < 80 || y < lastY);
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      {/* ── Floating pill nav ─────────────────────────────── */}
      <header
        className={`fixed left-1/2 top-4 z-50 w-[calc(100%-1.5rem)] max-w-none -translate-x-1/2 transition-all duration-500 md:w-[calc(100%-2rem)] ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-6 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-pink-soft flex items-center justify-between rounded-2xl px-5 py-3 shadow-nav md:rounded-full md:px-6 md:py-3.5">

          {/* Logo */}
          <GoldLogo />

          {/* Desktop links — center */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="font-sans text-[13px] font-medium text-foreground/65 transition-colors duration-200 hover:text-gold"
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            <button
              aria-label="Пошук"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-powder-100 hover:text-foreground md:flex"
            >
              <Search size={17} />
            </button>
            <Link
              href="/cart"
              aria-label="Кошик"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-powder-100 hover:text-foreground"
            >
              <ShoppingBag size={17} />
            </Link>
            <button
              aria-label="Меню"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-powder-100 md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile backdrop ───────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* ── Mobile drawer — floating card ─────────────────── */}
      <div
        className={`fixed right-4 top-4 z-50 w-72 rounded-3xl bg-white p-6 shadow-float transition-all duration-300 ease-in-out md:hidden ${
          menuOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <GoldLogo size="lg" />
          <button
            aria-label="Закрити"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-powder-100 text-foreground/60"
            onClick={() => setMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="rounded-2xl px-4 py-3 font-serif text-lg font-medium text-foreground/75 transition-colors hover:bg-powder-100 hover:text-gold"
              onClick={() => setMenuOpen(false)}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="mt-6 border-t border-foreground/8 pt-4">
          <Link
            href="/cart"
            className="flex items-center gap-3 rounded-2xl px-4 py-3 font-sans text-sm text-foreground/50 transition-colors hover:bg-powder-100 hover:text-gold"
            onClick={() => setMenuOpen(false)}
          >
            <ShoppingBag size={16} />
            Кошик
          </Link>
        </div>
      </div>
    </>
  );
}
