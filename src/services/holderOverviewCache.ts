import type { HolderOverviewResult } from '../types/holderOverview'
import { LAUNCHER_CACHE_TTL_MS } from './launcherCacheTtl'

const CACHE_PREFIX = 'cbs-launcher:holder-overview:'

export const HOLDER_OVERVIEW_CACHE_TTL_MS = LAUNCHER_CACHE_TTL_MS

interface CachedHolderOverviewEntry {
  result: HolderOverviewResult
  cachedAt: number
}

function cacheKey(mintAddress: string): string {
  return `${CACHE_PREFIX}${mintAddress.trim()}`
}

function readEntry(mintAddress: string): CachedHolderOverviewEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(mintAddress))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CachedHolderOverviewEntry

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

function isFresh(entry: CachedHolderOverviewEntry): boolean {
  return Date.now() - entry.cachedAt < LAUNCHER_CACHE_TTL_MS
}

export function getCachedHolderOverview(
  mintAddress: string,
): HolderOverviewResult | null {
  const entry = readEntry(mintAddress)

  if (!entry || !isFresh(entry)) {
    return null
  }

  return entry.result
}

export function setCachedHolderOverview(
  mintAddress: string,
  result: HolderOverviewResult,
): void {
  try {
    const entry: CachedHolderOverviewEntry = {
      result,
      cachedAt: Date.now(),
    }

    localStorage.setItem(cacheKey(mintAddress), JSON.stringify(entry))
  } catch {
    // Ignore quota / privacy mode errors
  }
}

export function clearCachedHolderOverview(mintAddress: string): void {
  try {
    localStorage.removeItem(cacheKey(mintAddress))
  } catch {
    // Ignore
  }
}
