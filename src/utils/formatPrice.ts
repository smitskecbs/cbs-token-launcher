export interface FormatPriceOptions {
  /** Shorter display for the card overview */
  compact?: boolean
}

export function hasValidMarketPrice(
  priceUsd: number | null | undefined,
): priceUsd is number {
  return typeof priceUsd === 'number' && Number.isFinite(priceUsd) && priceUsd > 0
}

/**
 * Format a USD token price without rounding small values to $0.
 */
export function formatPrice(
  priceUsd: number,
  options: FormatPriceOptions = {},
): string {
  const compact = options.compact ?? false

  if (priceUsd >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: compact ? 2 : priceUsd >= 100 ? 2 : 4,
    }).format(priceUsd)
  }

  if (priceUsd >= 0.01) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: compact ? 4 : 4,
    }).format(priceUsd)
  }

  const leadingZeros = Math.max(0, -Math.floor(Math.log10(priceUsd)) - 1)
  const significantDigits = compact ? 4 : 6
  const maxFractionDigits = Math.min(12, leadingZeros + significantDigits)

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFractionDigits,
  }).format(priceUsd)

  if (formatted === '$0' || formatted === '$0.00') {
    return `$${trimTrailingZeros(priceUsd.toPrecision(compact ? 4 : 6))}`
  }

  return formatted
}

function trimTrailingZeros(value: string): string {
  if (!value.includes('.')) {
    return value
  }

  return value.replace(/\.?0+$/, '')
}
