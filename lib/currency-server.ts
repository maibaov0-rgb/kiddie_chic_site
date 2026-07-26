import { FALLBACK_USD_UAH_RATE } from '@/lib/currency';

// NBU publishes official rates once a day around midday — a 24h cache keeps
// this off the request path while staying accurate enough for display-only
// conversion (the actual charge is always in UAH, see lib/currency.ts).
export async function getUsdRate(): Promise<number> {
  try {
    const res = await fetch(
      'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json',
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!res.ok) return FALLBACK_USD_UAH_RATE;
    const data: unknown = await res.json();
    const rate = Array.isArray(data) ? (data[0] as { rate?: unknown } | undefined)?.rate : undefined;
    return typeof rate === 'number' && rate > 0 ? rate : FALLBACK_USD_UAH_RATE;
  } catch {
    return FALLBACK_USD_UAH_RATE;
  }
}
