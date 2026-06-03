import { fetchTokenHolderOverview } from '../solana/fetchTokenHolderOverview'
import type { HolderOverviewResult } from '../types/holderOverview'
import {
  clearCachedHolderOverview,
  getCachedHolderOverview,
  setCachedHolderOverview,
} from './holderOverviewCache'

export interface LoadHolderOverviewOptions {
  forceRefresh?: boolean
}

export async function loadHolderOverview(
  mintAddress: string,
  options: LoadHolderOverviewOptions = {},
): Promise<HolderOverviewResult> {
  if (!options.forceRefresh) {
    const cached = getCachedHolderOverview(mintAddress)

    if (cached) {
      return cached
    }
  } else {
    clearCachedHolderOverview(mintAddress)
  }

  const result = await fetchTokenHolderOverview(mintAddress)
  setCachedHolderOverview(mintAddress, result)

  return result
}
