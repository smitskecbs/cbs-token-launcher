import type { MarketStatusResult } from '../../types/marketStatus'
import { MARKET_STATUS } from '../../types/marketStatus'
import { formatDexName, formatPairName } from '../../utils/formatDexPair'

const DEXSCREENER_TOKEN_URL =
  'https://api.dexscreener.com/latest/dex/tokens'

export type DexscreenerFetchResult =
  | { status: 'found'; result: MarketStatusResult }
  | { status: 'no_pairs' }
  | { status: 'error'; error: string }

interface DexscreenerTokenResponse {
  pairs?: DexscreenerPair[] | null
}

interface DexscreenerTokenRef {
  symbol?: string
}

interface DexscreenerPair {
  chainId?: string
  dexId?: string
  url?: string
  priceUsd?: string
  baseToken?: DexscreenerTokenRef
  quoteToken?: DexscreenerTokenRef
  liquidity?: {
    usd?: number | null
  } | null
}

/** Fetch read-only pair/trading status from Dexscreener public API */
export async function fetchDexscreenerMarketData(
  mintAddress: string,
): Promise<DexscreenerFetchResult> {
  const trimmed = mintAddress.trim()

  try {
    const response = await fetch(`${DEXSCREENER_TOKEN_URL}/${trimmed}`)

    if (!response.ok) {
      return {
        status: 'error',
        error: `Dexscreener HTTP ${response.status}`,
      }
    }

    const data = (await response.json()) as DexscreenerTokenResponse
    const bestPair = pickBestSolanaPair(data.pairs ?? [])

    if (!bestPair) {
      return { status: 'no_pairs' }
    }

    const liquidityUsd = bestPair.liquidity?.usd ?? null
    const dexId = bestPair.dexId ?? null
    const pairName = formatPairName(
      bestPair.baseToken?.symbol,
      bestPair.quoteToken?.symbol,
    )
    const priceUsd = parsePriceUsd(bestPair.priceUsd)

    return {
      status: 'found',
      result: {
        mintAddress: trimmed,
        tradable: true,
        tradingStatus: MARKET_STATUS.TRADABLE,
        poolStatus: MARKET_STATUS.POOL_FOUND,
        pairName,
        dexName: dexId ? formatDexName(dexId) : null,
        liquidityUsd:
          typeof liquidityUsd === 'number' && liquidityUsd > 0
            ? liquidityUsd
            : null,
        priceUsd,
        pairUrl: bestPair.url ?? null,
        dexId,
        priceSource: priceUsd !== null ? 'dexscreener' : null,
        liquiditySource:
          typeof liquidityUsd === 'number' && liquidityUsd > 0
            ? 'dexscreener'
            : null,
        poolDataNote: null,
        error: null,
      },
    }
  } catch {
    return {
      status: 'error',
      error: 'Dexscreener request failed',
    }
  }
}

/** @deprecated Use fetchDexscreenerMarketData via resolveMarketStatus */
export async function fetchMarketStatusFromDexscreener(
  mintAddress: string,
): Promise<MarketStatusResult> {
  const dex = await fetchDexscreenerMarketData(mintAddress)

  if (dex.status === 'found') {
    return dex.result
  }

  return {
    mintAddress: mintAddress.trim(),
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
    error: dex.status === 'error' ? dex.error : null,
  }
}

function pickBestSolanaPair(
  pairs: DexscreenerPair[],
): DexscreenerPair | null {
  let bestPair: DexscreenerPair | null = null
  let bestLiquidity = 0

  for (const pair of pairs) {
    if (pair.chainId !== 'solana') {
      continue
    }

    const liquidityUsd = pair.liquidity?.usd ?? 0

    if (typeof liquidityUsd !== 'number' || liquidityUsd <= 0) {
      continue
    }

    if (liquidityUsd > bestLiquidity) {
      bestLiquidity = liquidityUsd
      bestPair = pair
    }
  }

  return bestPair
}

function parsePriceUsd(priceUsd: string | undefined): number | null {
  if (!priceUsd) {
    return null
  }

  const parsed = Number(priceUsd)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
