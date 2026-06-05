import type { MarketStatusResult } from '../types/marketStatus'
import { LAUNCHER_CACHE_TTL_MS } from './launcherCacheTtl'

const CACHE_PREFIX = 'cbs-launcher:market-status:'

export const MARKET_STATUS_CACHE_TTL_MS = LAUNCHER_CACHE_TTL_MS

interface CachedMarketStatusEntry {
  result: MarketStatusResult
  cachedAt: number
}

function cacheKey(mintAddress: string): string {
  return `${CACHE_PREFIX}${mintAddress.trim()}`
}

function readEntry(mintAddress: string): CachedMarketStatusEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(mintAddress))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CachedMarketStatusEntry

    if (
      typeof parsed.cachedAt !== 'number' ||
      !parsed.result ||
      typeof parsed.result.mintAddress !== 'string'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function isFresh(entry: CachedMarketStatusEntry): boolean {
  return Date.now() - entry.cachedAt < LAUNCHER_CACHE_TTL_MS
}

export function getCachedMarketStatus(
  mintAddress: string,
): MarketStatusResult | null {
  const entry = readEntry(mintAddress)

  if (!entry || !isFresh(entry)) {
    return null
  }

  return entry.result
}

export function setCachedMarketStatus(
  mintAddress: string,
  result: MarketStatusResult,
): void {
  try {
    const entry: CachedMarketStatusEntry = {
      result,
      cachedAt: Date.now(),
    }

    localStorage.setItem(cacheKey(mintAddress), JSON.stringify(entry))
  } catch {
    // Ignore quota / privacy mode errors
  }
}

export function clearCachedMarketStatus(mintAddress: string): void {
  try {
    localStorage.removeItem(cacheKey(mintAddress))
  } catch {
    // Ignore
  }
}
