import type { TokenMarketData } from '../types/tokenMarketData'
import { formatLiquidity } from './formatLiquidity'
import { formatPrice, hasValidMarketPrice } from './formatPrice'

const EMPTY_VALUE = '—'

export function formatMarketPrice(
  priceUsd: number | null | undefined,
  options: { compact?: boolean } = {},
): string {
  if (!hasValidMarketPrice(priceUsd)) {
    return EMPTY_VALUE
  }

  return formatPrice(priceUsd, options)
}

export function formatMarketLiquidity(
  liquidityUsd: number | null | undefined,
): string {
  if (
    typeof liquidityUsd !== 'number' ||
    !Number.isFinite(liquidityUsd) ||
    liquidityUsd < 0
  ) {
    return EMPTY_VALUE
  }

  return formatLiquidity(liquidityUsd)
}

export function formatMarketVolume(
  volume24hUsd: number | null | undefined,
): string {
  if (
    typeof volume24hUsd !== 'number' ||
    !Number.isFinite(volume24hUsd) ||
    volume24hUsd < 0
  ) {
    return EMPTY_VALUE
  }

  if (volume24hUsd === 0) {
    return '$0'
  }

  return formatLiquidity(volume24hUsd)
}

export function hasDisplayableMarketData(data: TokenMarketData): boolean {
  return (
    data.poolExists &&
    (hasValidMarketPrice(data.priceUsd) ||
      (typeof data.liquidityUsd === 'number' &&
        Number.isFinite(data.liquidityUsd) &&
        data.liquidityUsd > 0))
  )
}
