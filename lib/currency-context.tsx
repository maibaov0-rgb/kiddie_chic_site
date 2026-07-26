'use client';

import { createContext, useContext } from 'react';
import { FALLBACK_USD_UAH_RATE } from '@/lib/currency';

const UsdRateContext = createContext<number>(FALLBACK_USD_UAH_RATE);

export function CurrencyProvider({ rate, children }: { rate: number; children: React.ReactNode }) {
  return <UsdRateContext.Provider value={rate}>{children}</UsdRateContext.Provider>;
}

export function useUsdRate(): number {
  return useContext(UsdRateContext);
}
