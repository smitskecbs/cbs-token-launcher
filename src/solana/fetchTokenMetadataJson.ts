import {
  clearCachedMetadataJson,
  getCachedMetadataJson,
  setCachedMetadataJson,
} from '../services/metadataJsonCache'

/** Off-chain JSON from the Metaplex metadata URI */
export interface TokenMetadataJson {
  name?: string
  symbol?: string
  description?: string
  image?: string
  external_url?: string
  /** Token category authored in CBS Token Builder metadata JSON */
  category?: string
  tags?: string[]
  extensions?: {
    website?: string
    telegram?: string
    discord?: string
    twitter?: string
    facebook?: string
    github?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface FetchTokenMetadataJsonOptions {
  forceRefresh?: boolean
}

/**
 * Fetch and parse JSON from an on-chain metadata URI.
 * Results are cached for 10 minutes to reduce HTTP requests.
 */
export async function fetchTokenMetadataJson(
  metadataUri: string,
  options: FetchTokenMetadataJsonOptions = {},
): Promise<TokenMetadataJson | null> {
  const uri = metadataUri.trim()

  if (!uri) {
    return null
  }

  if (options.forceRefresh) {
    clearCachedMetadataJson(uri)
  } else {
    const cached = getCachedMetadataJson(uri)

    if (cached) {
      return cached
    }
  }

  try {
    const response = await fetch(uri)

    if (!response.ok) {
      return null
    }

    const json = (await response.json()) as TokenMetadataJson
    setCachedMetadataJson(uri, json)

    return json
  } catch {
    return null
  }
}

/** Resolve image field to a browser-loadable URL, or null if invalid */
export function resolveMetadataImageUrl(
  image: string | undefined,
): string | null {
  if (!image) {
    return null
  }

  const trimmed = image.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${trimmed.slice('ipfs://'.length)}`
  }

  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  ) {
    return trimmed
  }

  return null
}
