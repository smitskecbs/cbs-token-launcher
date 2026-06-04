import type { MarketStatusResult } from '../types/marketStatus'
import { MARKET_STATUS } from '../types/marketStatus'

/** True when market data shows no pool and the token is not tradable yet */
export function canPreparePoolCreation(
  result: MarketStatusResult | null | undefined,
): boolean {
  if (!result || result.error) {
    return false
  }

  return (
    result.tradingStatus === MARKET_STATUS.NOT_TRADABLE &&
    result.poolStatus === MARKET_STATUS.NO_POOL
  )
}
