import type { MarketStatusResult } from '../types/marketStatus'
import { resolveMarketStatus } from './resolveMarketStatus'
import {
  clearCachedMarketStatus,
  getCachedMarketStatus,
  setCachedMarketStatus,
} from './marketStatusCache'

export interface LoadMarketStatusOptions {
  forceRefresh?: boolean
}

/** Load market status from cache or provider chain (Dexscreener → Jupiter → Birdeye) */
export async function loadMarketStatus(
  mintAddress: string,
  options: LoadMarketStatusOptions = {},
): Promise<MarketStatusResult> {
  if (!options.forceRefresh) {
    const cached = getCachedMarketStatus(mintAddress)

    if (cached) {
      return cached
    }
  } else {
    clearCachedMarketStatus(mintAddress)
  }

  const result = await resolveMarketStatus(mintAddress)
  setCachedMarketStatus(mintAddress, result)
  return result
}
