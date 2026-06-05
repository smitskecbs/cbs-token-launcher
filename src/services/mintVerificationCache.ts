import type { ReadTokenMintResult } from '../solana/verifyMint'
import { LAUNCHER_CACHE_TTL_MS } from './launcherCacheTtl'

const CACHE_PREFIX = 'cbs-launcher:mint-verify:'

export const MINT_VERIFICATION_CACHE_TTL_MS = LAUNCHER_CACHE_TTL_MS

interface CachedMintVerificationEntry {
  result: ReadTokenMintResult
  cachedAt: number
}

function cacheKey(mintAddress: string): string {
  return `${CACHE_PREFIX}${mintAddress.trim()}`
}

function readEntry(
  mintAddress: string,
): CachedMintVerificationEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(mintAddress))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CachedMintVerificationEntry

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

function isFresh(entry: CachedMintVerificationEntry): boolean {
  return Date.now() - entry.cachedAt < LAUNCHER_CACHE_TTL_MS
}

/** Read a fresh cached verification result, or null if missing / expired */
export function getCachedMintVerification(
  mintAddress: string,
): ReadTokenMintResult | null {
  const entry = readEntry(mintAddress)

  if (!entry || !isFresh(entry)) {
    return null
  }

  return entry.result
}

export function setCachedMintVerification(
  mintAddress: string,
  result: ReadTokenMintResult,
): void {
  try {
    const entry: CachedMintVerificationEntry = {
      result,
      cachedAt: Date.now(),
    }

    localStorage.setItem(
      cacheKey(mintAddress),
      JSON.stringify(entry),
    )
  } catch {
    // Ignore quota / privacy mode errors — verification still works without cache
  }
}

export function clearCachedMintVerification(
  mintAddress: string,
): void {
  try {
    localStorage.removeItem(cacheKey(mintAddress))
  } catch {
    // Ignore
  }
}
