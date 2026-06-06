import {
  getDexscreenerPairUrl,
  getDexscreenerTokenUrl,
} from '../config/urls'

function isValidDexscreenerHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)

    return (
      url.protocol === 'https:' &&
      url.hostname === 'dexscreener.com' &&
      url.pathname.length > 1
    )
  } catch {
    return false
  }
}

export function resolveDexscreenerUrl(options: {
  pairUrl?: string | null
  pairAddress?: string | null
  mintAddress: string
}): string | null {
  const pairAddress = options.pairAddress?.trim()

  if (pairAddress) {
    return getDexscreenerPairUrl(pairAddress)
  }

  const pairUrl = options.pairUrl?.trim()

  if (pairUrl && isValidDexscreenerHttpsUrl(pairUrl)) {
    return pairUrl
  }

  const mintAddress = options.mintAddress?.trim()

  if (mintAddress) {
    return getDexscreenerTokenUrl(mintAddress)
  }

  return null
}

export function logDexscreenerHref(href: string): void {
  console.log(`[dexscreener-link] href = ${href}`)
}
