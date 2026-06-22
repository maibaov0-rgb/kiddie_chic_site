'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function switchTo(next: string) {
    if (next === locale) return;
    // Preserve dynamic params (e.g. [category], [slug])
    router.replace(
      // @ts-expect-error pathname carries route shape; params provides values
      { pathname, params },
      { locale: next },
    );
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={`flex items-center rounded-full bg-powder-100/70 p-0.5 text-[11px] font-semibold ${
        compact ? '' : ''
      }`}
    >
      {routing.locales.map((loc) => {
        const active = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-pressed={active}
            className={`min-w-9 rounded-full px-2.5 py-1 uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${
              active
                ? 'bg-white text-foreground shadow-card'
                : 'text-foreground/55 hover:text-foreground'
            }`}
          >
            {loc}
          </button>
        );
      })}
    </div>
  );
}
