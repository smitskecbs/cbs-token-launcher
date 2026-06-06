import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import {
  getDexscreenerPairUrl,
  getRaydiumAddLiquidityUrl,
  getRaydiumSwapUrl,
} from '../config/urls'
import { isValidHttpsUrl } from './externalLink'
import { resolveDexscreenerUrl } from './dexscreenerUrl'
import {
  getLaunchJupiterTradeUrl,
  getLaunchPoolUrl,
  getLaunchRaydiumPoolCreationLink,
  getLaunchRaydiumTradeUrl,
} from './launchTradingLinks'

function isValidDexscreenerHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)

    return (
      url.protocol === 'https:' &&
      url.hostname === 'dexscreener.com' &&
      url.pathname.length > 1
    )
  } catch {
    return false
  }
}

export function resolveViewPoolUrl(
  launch: Launch,
  marketData?: TokenMarketData | null,
): string | null {
  const adminPoolUrl = getLaunchPoolUrl(launch)

  if (adminPoolUrl && isValidHttpsUrl(adminPoolUrl)) {
    return adminPoolUrl
  }

  const pairAddress = marketData?.pairAddress?.trim()

  if (pairAddress) {
    return getDexscreenerPairUrl(pairAddress)
  }

  const pairUrl = marketData?.pairUrl?.trim()

  if (pairUrl && isValidDexscreenerHttpsUrl(pairUrl)) {
    return pairUrl
  }

  return null
}

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
  const viewPoolUrl = resolveViewPoolUrl(launch, marketData)
  const hasPool = Boolean(viewPoolUrl) || marketPoolExists

  const dexscreenerUrl = marketData
    ? resolveDexscreenerUrl({
        pairUrl: marketData.pairUrl,
        pairAddress: marketData.pairAddress,
        mintAddress: launch.mintAddress,
      })
    : null

  let raydiumTradeUrl: string | null = null
  let raydiumAddLiquidityUrl: string | null = null

  if (hasPool) {
    const configuredTradeUrl = getLaunchRaydiumTradeUrl(launch)
    raydiumTradeUrl =
      configuredTradeUrl && isValidHttpsUrl(configuredTradeUrl)
        ? configuredTradeUrl
        : getRaydiumSwapUrl(launch.mintAddress)

    const adminPoolUrl = getLaunchPoolUrl(launch)

    if (adminPoolUrl?.includes('raydium.io') && isValidHttpsUrl(adminPoolUrl)) {
      raydiumAddLiquidityUrl = adminPoolUrl
    } else {
      raydiumAddLiquidityUrl = getRaydiumAddLiquidityUrl(launch.mintAddress)
    }
  }

  return {
    hasPool,
    poolStatusLabel: hasPool ? 'Pool Active' : 'No pool created yet',
    viewPoolUrl: hasPool ? viewPoolUrl : null,
    dexscreenerUrl: hasPool ? dexscreenerUrl : null,
    raydiumTradeUrl,
    raydiumAddLiquidityUrl,
    jupiterUrl: hasPool ? getLaunchJupiterTradeUrl(launch) : null,
    raydiumPoolCreationUrl: getLaunchRaydiumPoolCreationLink(),
  }
}
