import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import "@/app/globals.css";

// Body, navigation, buttons — Montserrat (client preference, Medium 500 default)
const sans = Montserrat({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Headings — Playfair Display: elegant high-contrast serif with full Cyrillic
const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Kiddie Chic",
    default: "Kiddie Chic — преміум дитячі сукні",
  },
  description: "Колекція дитячих суконь преміум-сегменту. Доставка по Україні Новою Поштою.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering (required for static export / GitHub Pages)
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <head>
        {/* Product photos come from Cloudinary — warm up the connection early */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
