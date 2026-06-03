export interface FormatLiquidityOptions {
  /** Shorter display for the card overview */
  compact?: boolean
}

export function hasValidMarketLiquidity(
  liquidityUsd: number | null | undefined,
): liquidityUsd is number {
  return (
    typeof liquidityUsd === 'number' &&
    Number.isFinite(liquidityUsd) &&
    liquidityUsd >= 0
  )
}

/** Format USD liquidity for overview or market data panels */
export function formatLiquidity(
  liquidityUsd: number,
  options: FormatLiquidityOptions = {},
): string {
  const compact = options.compact ?? false

  if (compact) {
    if (liquidityUsd >= 1_000_000) {
      return `$${(liquidityUsd / 1_000_000).toFixed(1)}M`
    }

    if (liquidityUsd >= 1_000) {
      return `$${(liquidityUsd / 1_000).toFixed(1)}K`
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: liquidityUsd >= 1 ? 0 : 2,
  }).format(liquidityUsd)
}
