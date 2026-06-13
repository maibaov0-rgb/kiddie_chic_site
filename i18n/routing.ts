import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uk", "en"] as const,
  defaultLocale: "uk",
  // Ukrainian → /, English → /en/...
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
