import {
  getDexscreenerPairUrl,
  getDexscreenerTokenUrl,
} from '../config/urls'

const INVALID_HREFS = new Set(['', '#', 'about:blank'])

export function normalizeExternalUrl(
  value: string | null | undefined,
): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : ''

  if (!trimmed || INVALID_HREFS.has(trimmed.toLowerCase())) {
    return null
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  if (trimmed.startsWith('/')) {
    return `https://dexscreener.com${trimmed}`
  }

  try {
    const url = new URL(trimmed)

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString()
    }
  } catch {
    return null
  }

  return null
}

export function resolveDexscreenerUrl(options: {
  pairUrl?: string | null
  pairAddress?: string | null
  mintAddress: string
  allowTokenFallback?: boolean
}): string | null {
  const fromPairUrl = normalizeExternalUrl(options.pairUrl)

  if (fromPairUrl) {
    return fromPairUrl
  }

  const pairAddress = options.pairAddress?.trim()

  if (pairAddress) {
    return getDexscreenerPairUrl(pairAddress)
  }

  if (options.allowTokenFallback) {
    return getDexscreenerTokenUrl(options.mintAddress)
  }

  return null
}
