import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-milk">
      <header className="border-b border-foreground/8 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20 md:px-6">
          <Link
            href="/cart"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground/65 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:rounded-full"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">До кошика</span>
          </Link>

          <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-gold md:text-2xl" aria-label="Kiddie Chic — на головну">
            KIDDIE CHIC
          </Link>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/55 md:text-xs">
            <ShieldCheck size={14} className="text-gold" />
            <span className="hidden sm:inline">Захищена оплата</span>
            <span className="sm:hidden">SSL</span>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-foreground/8 bg-white/70 py-4 text-center text-[11px] text-foreground/45">
        © {new Date().getFullYear()} Kiddie Chic · Усі права захищені
      </footer>
    </div>
  );
}
