export interface TokenMarketData {
  mintAddress: string
  poolExists: boolean
  dexName: string | null
  pairAddress: string | null
  pairName: string | null
  pairUrl: string | null
  liquidityUsd: number | null
  priceUsd: number | null
  volume24hUsd: number | null
}

export interface TokenMarketDataResponse {
  ok: true
  cached: boolean
  data: TokenMarketData
}
