// EN version prices are shown in USD (rounded to whole numbers), converted
// from the UAH price stored on the product — the actual payment is always
// charged in UAH regardless of display locale, since the payment provider
// (ПУМБ/Hutko) only supports UAH.

export const FALLBACK_USD_UAH_RATE = 41;

export function formatPrice(uah: number, locale: string, usdRate: number): string {
  if (locale === 'en') {
    const usd = Math.round(uah / usdRate);
    return `$${usd.toLocaleString('en-US')}`;
  }
  return `${uah.toLocaleString('uk-UA')} ₴`;
}
