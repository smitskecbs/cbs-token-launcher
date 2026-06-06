import {
  getDexscreenerPairUrl,
  getDexscreenerTokenUrl,
} from '../config/urls'
import { escapeHtml } from './html'

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

export function renderDexscreenerAnchorHtml(
  url: string,
  label: string,
  className = 'market-dexscreener-link',
): string {
  logDexscreenerHref(url)

  return `<a class="${escapeHtml(className)}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" data-dexscreener-link>${escapeHtml(label)}</a>`
}

let dexscreenerClickLoggingAttached = false

export function attachDexscreenerLinkClickLogging(): void {
  if (dexscreenerClickLoggingAttached) {
    return
  }

  dexscreenerClickLoggingAttached = true

  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[data-dexscreener-link]',
      )

      if (!link) {
        return
      }

      console.log(
        `[dexscreener-click] href = ${link.getAttribute('href') ?? ''}`,
      )
    },
    true,
  )
}
