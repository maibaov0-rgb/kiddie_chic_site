import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uk", "en"] as const,
  defaultLocale: "uk",
  // Ukrainian → /, English → /en/...
  localePrefix: "as-needed",
  // Prefix-less URLs must always mean Ukrainian, unconditionally — mova
  // switches only via the manual LanguageSwitcher, never auto-detection.
  // Without this, cookie/Accept-Language-based detection can render English
  // under a prefix-less URL (e.g. /catalog/dresses), and ISR then caches
  // that response for everyone under the same URL for `revalidate` seconds.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
