import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import {
  getRaydiumAddLiquidityUrl,
  getRaydiumSwapUrl,
} from '../config/urls'
import { resolveDexscreenerUrl } from './dexscreenerUrl'
import {
  getLaunchJupiterTradeUrl,
  getLaunchPoolUrl,
  getLaunchRaydiumPoolCreationLink,
  getLaunchRaydiumTradeUrl,
} from './launchTradingLinks'

export interface PoolTradingState {
  hasPool: boolean
  poolStatusLabel: 'Pool Active' | 'No pool created yet'
  viewPoolUrl: string | null
  dexscreenerUrl: string | null
  raydiumTradeUrl: string | null
  raydiumAddLiquidityUrl: string | null
  jupiterUrl: string | null
  raydiumPoolCreationUrl: string
}

export function resolvePoolTradingState(
  launch: Launch,
  marketData?: TokenMarketData | null,
): PoolTradingState {
  const adminPoolUrl = getLaunchPoolUrl(launch)
  const marketPoolExists = marketData?.poolExists === true
  const hasPool = Boolean(adminPoolUrl) || marketPoolExists

  const dexscreenerUrl = marketData
    ? resolveDexscreenerUrl({
        pairUrl: marketData.pairUrl,
        pairAddress: marketData.pairAddress,
        mintAddress: launch.mintAddress,
        allowTokenFallback: marketPoolExists,
      })
    : null

  const viewPoolUrl = adminPoolUrl || (marketPoolExists ? dexscreenerUrl : null)

  let raydiumTradeUrl: string | null = null
  let raydiumAddLiquidityUrl: string | null = null

  if (hasPool) {
    raydiumTradeUrl =
      getLaunchRaydiumTradeUrl(launch) ?? getRaydiumSwapUrl(launch.mintAddress)

    if (adminPoolUrl?.includes('raydium.io')) {
      raydiumAddLiquidityUrl = adminPoolUrl
    } else {
      raydiumAddLiquidityUrl = getRaydiumAddLiquidityUrl(launch.mintAddress)
    }
  }

  return {
    hasPool,
    poolStatusLabel: hasPool ? 'Pool Active' : 'No pool created yet',
    viewPoolUrl,
    dexscreenerUrl: hasPool ? dexscreenerUrl : null,
    raydiumTradeUrl,
    raydiumAddLiquidityUrl,
    jupiterUrl: hasPool ? getLaunchJupiterTradeUrl(launch) : null,
    raydiumPoolCreationUrl: getLaunchRaydiumPoolCreationLink(),
  }
}
