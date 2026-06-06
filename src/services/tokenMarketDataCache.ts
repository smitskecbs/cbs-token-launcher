import type { TokenMarketData } from '../types/tokenMarketData'
import { LAUNCHER_CACHE_TTL_MS } from './launcherCacheTtl'

const CACHE_PREFIX = 'cbs-launcher:token-market-data:'

interface CachedTokenMarketDataEntry {
  data: TokenMarketData
  cachedAt: number
}

function cacheKey(mintAddress: string): string {
  return `${CACHE_PREFIX}${mintAddress.trim()}`
}

function readEntry(mintAddress: string): CachedTokenMarketDataEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(mintAddress))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CachedTokenMarketDataEntry

    if (
      typeof parsed.cachedAt !== 'number' ||
      !parsed.data ||
      typeof parsed.data.mintAddress !== 'string'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function isFresh(entry: CachedTokenMarketDataEntry): boolean {
  return Date.now() - entry.cachedAt < LAUNCHER_CACHE_TTL_MS
}

export function getCachedTokenMarketData(
  mintAddress: string,
): TokenMarketData | null {
  const entry = readEntry(mintAddress)

  if (!entry || !isFresh(entry)) {
    return null
  }

  return entry.data
}

export function setCachedTokenMarketData(
  mintAddress: string,
  data: TokenMarketData,
): void {
  try {
    const entry: CachedTokenMarketDataEntry = {
      data,
      cachedAt: Date.now(),
    }

    localStorage.setItem(cacheKey(mintAddress), JSON.stringify(entry))
  } catch {
    // Ignore quota / privacy mode errors
  }
}

export function clearCachedTokenMarketData(mintAddress: string): void {
  try {
    localStorage.removeItem(cacheKey(mintAddress))
  } catch {
    // Ignore
  }
}
