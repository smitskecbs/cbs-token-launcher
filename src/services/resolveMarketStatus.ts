import type { MarketStatusResult } from '../types/marketStatus'
import { MARKET_STATUS } from '../types/marketStatus'
import { fetchBirdeyePriceQuote } from './integrations/birdeye'
import { fetchDexscreenerMarketData } from './integrations/dexscreener'
import {
  fetchJupiterPriceQuote,
  type JupiterPriceQuote,
} from './integrations/jupiterPrice'

/** Resolve market status: Dexscreener first, then Jupiter, then Birdeye (future) */
export async function resolveMarketStatus(
  mintAddress: string,
): Promise<MarketStatusResult> {
  const trimmed = mintAddress.trim()
  const dex = await fetchDexscreenerMarketData(trimmed)

  if (dex.status === 'found') {
    return dex.result
  }

  const jupiter = await fetchJupiterPriceQuote(trimmed)

  if (jupiter) {
    return buildFallbackResult(trimmed, jupiter, 'jupiter')
  }

  const birdeye = await fetchBirdeyePriceQuote(trimmed)

  if (birdeye) {
    return buildFallbackResult(trimmed, birdeye, 'birdeye')
  }

  return buildUnavailableResult(
    trimmed,
    dex.status === 'error' ? dex.error : null,
  )
}

function buildFallbackResult(
  mintAddress: string,
  quote: JupiterPriceQuote,
  source: 'jupiter' | 'birdeye',
): MarketStatusResult {
  return {
    mintAddress,
    tradable: true,
    tradingStatus: MARKET_STATUS.TRADABLE,
    poolStatus: MARKET_STATUS.POOL_DATA_UNAVAILABLE_DEXSCREENER,
    pairName: null,
    dexName: null,
    liquidityUsd: quote.liquidityUsd,
    priceUsd: quote.priceUsd,
    pairUrl: null,
    dexId: null,
    priceSource: source,
    liquiditySource: quote.liquidityUsd !== null ? source : null,
    poolDataNote: MARKET_STATUS.POOL_DATA_UNAVAILABLE_DEXSCREENER,
    error: null,
  }
}

function buildUnavailableResult(
  mintAddress: string,
  dexError: string | null,
): MarketStatusResult {
  return {
    mintAddress,
    tradable: false,
    tradingStatus: MARKET_STATUS.NOT_TRADABLE,
    poolStatus: MARKET_STATUS.NO_POOL,
    pairName: null,
    dexName: null,
    liquidityUsd: null,
    priceUsd: null,
    pairUrl: null,
    dexId: null,
    priceSource: null,
    liquiditySource: null,
    poolDataNote: null,
    error: dexError,
  }
}
