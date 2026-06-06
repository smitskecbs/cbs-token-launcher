import { getDexscreenerTokenUrl } from '../config/urls'
import { renderExternalAnchorHtml } from './externalLink'

export function resolveDexscreenerUrl(mintAddress: string): string | null {
  const trimmed = mintAddress.trim()

  if (!trimmed) {
    return null
  }

  return getDexscreenerTokenUrl(trimmed)
}

export function renderDexscreenerAnchorHtml(
  url: string,
  label: string,
  className = 'market-dexscreener-link',
): string {
  return renderExternalAnchorHtml(url, label, className)
}
