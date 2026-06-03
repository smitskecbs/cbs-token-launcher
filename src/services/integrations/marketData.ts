import type { EnrichedLaunch, Launch } from '../../types/launch'

/**
 * Future Phase — market data integrations
 *
 * Planned providers:
 * - Jupiter: swap quotes, routing, price hints
 * - Birdeye: price, liquidity, volume, market cap
 * - Dexscreener: pair charts, liquidity pools, trending pairs
 *
 * enrichLaunchWithMarketData() would merge provider responses into LaunchEnrichment
 * fields (priceUsd, liquidityUsd, marketCapUsd, volume24hUsd).
 */

export async function enrichLaunchWithMarketData(
  launch: Launch,
): Promise<EnrichedLaunch> {
  // Stub: no market calls yet
  return { ...launch }
}
