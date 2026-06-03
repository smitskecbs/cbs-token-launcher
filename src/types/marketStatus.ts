/** Read-only market data provider */
export type MarketDataSource = 'dexscreener' | 'jupiter' | 'birdeye'

/** Read-only trading/pool detection result for a token mint */
export interface MarketStatusResult {
  mintAddress: string
  tradable: boolean
  tradingStatus: string
  poolStatus: string
  /** e.g. "CBS / SOL" */
  pairName: string | null
  /** Human-readable DEX label, e.g. "Raydium" */
  dexName: string | null
  liquidityUsd: number | null
  priceUsd: number | null
  pairUrl: string | null
  dexId: string | null
  priceSource: MarketDataSource | null
  liquiditySource: MarketDataSource | null
  /** Shown when Dexscreener has no pool but a fallback has quote data */
  poolDataNote: string | null
  /** 24h volume in USD — required for market risk when available */
  volume24hUsd?: number | null
  /** Top holder concentration % — required for market risk when available */
  topHolderConcentrationPercent?: number | null
  error: string | null
}

export const MARKET_STATUS = {
  TRADABLE: 'Tradable',
  NOT_TRADABLE: 'Not tradable yet',
  POOL_FOUND: 'Pool found',
  NO_POOL: 'No pool found',
  NO_PAIR: 'No pair found',
  POOL_DATA_UNAVAILABLE_DEXSCREENER:
    'Pool data unavailable from Dexscreener',
  CHECKING: 'Checking…',
  UNAVAILABLE: 'Status unavailable',
} as const
