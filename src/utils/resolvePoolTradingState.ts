import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import {
  getDexscreenerTokenUrl,
  getRaydiumAddLiquidityUrl,
  getRaydiumSwapUrl,
} from '../config/urls'
import { isValidHttpsUrl } from './externalLink'
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
  const marketPoolExists = marketData?.poolExists === true
  const adminPoolUrl = getLaunchPoolUrl(launch)
  const hasAdminPoolUrl = Boolean(adminPoolUrl && isValidHttpsUrl(adminPoolUrl))
  const hasPool = marketPoolExists || hasAdminPoolUrl
  const mintDexscreenerUrl = getDexscreenerTokenUrl(launch.mintAddress)

  let raydiumTradeUrl: string | null = null
  let raydiumAddLiquidityUrl: string | null = null

  if (hasPool) {
    const configuredTradeUrl = getLaunchRaydiumTradeUrl(launch)
    raydiumTradeUrl =
      configuredTradeUrl && isValidHttpsUrl(configuredTradeUrl)
        ? configuredTradeUrl
        : getRaydiumSwapUrl(launch.mintAddress)

    if (adminPoolUrl?.includes('raydium.io') && isValidHttpsUrl(adminPoolUrl)) {
      raydiumAddLiquidityUrl = adminPoolUrl
    } else {
      raydiumAddLiquidityUrl = getRaydiumAddLiquidityUrl(launch.mintAddress)
    }
  }

  return {
    hasPool,
    poolStatusLabel: hasPool ? 'Pool Active' : 'No pool created yet',
    viewPoolUrl: hasPool ? mintDexscreenerUrl : null,
    dexscreenerUrl: hasPool ? mintDexscreenerUrl : null,
    raydiumTradeUrl,
    raydiumAddLiquidityUrl,
    jupiterUrl: hasPool ? getLaunchJupiterTradeUrl(launch) : null,
    raydiumPoolCreationUrl: getLaunchRaydiumPoolCreationLink(),
  }
}
