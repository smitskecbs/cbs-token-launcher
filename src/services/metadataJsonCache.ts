import type { TokenMetadataJson } from '../solana/fetchTokenMetadataJson'

const CACHE_PREFIX = 'cbs-launcher:metadata-json:'
const CACHE_TTL_MS = 10 * 60 * 1000

export const METADATA_JSON_CACHE_TTL_MS = CACHE_TTL_MS

interface CachedMetadataJsonEntry {
  data: TokenMetadataJson
  cachedAt: number
}

function cacheKey(metadataUri: string): string {
  return `${CACHE_PREFIX}${metadataUri.trim()}`
}

function readEntry(
  metadataUri: string,
): CachedMetadataJsonEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(metadataUri))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CachedMetadataJsonEntry

    if (typeof parsed.cachedAt !== 'number' || !parsed.data) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function isFresh(entry: CachedMetadataJsonEntry): boolean {
  return Date.now() - entry.cachedAt < CACHE_TTL_MS
}

export function getCachedMetadataJson(
  metadataUri: string,
): TokenMetadataJson | null {
  const entry = readEntry(metadataUri)

  if (!entry || !isFresh(entry)) {
    return null
  }

  return entry.data
}

export function setCachedMetadataJson(
  metadataUri: string,
  data: TokenMetadataJson,
): void {
  try {
    const entry: CachedMetadataJsonEntry = {
      data,
      cachedAt: Date.now(),
    }

    localStorage.setItem(
      cacheKey(metadataUri),
      JSON.stringify(entry),
    )
  } catch {
    // Ignore storage errors
  }
}

export function clearCachedMetadataJson(
  metadataUri: string,
): void {
  try {
    localStorage.removeItem(cacheKey(metadataUri))
  } catch {
    // Ignore
  }
}
