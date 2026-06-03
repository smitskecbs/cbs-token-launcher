import type { MarketStatusResult } from '../types/marketStatus'
import type { LaunchMarketRiskAssessment } from '../types/launchMarketRisk'
import { MARKET_RISK_UNAVAILABLE_MESSAGE } from '../types/launchMarketRisk'

/**
 * Market risk requires real holder concentration and volume data.
 * Returns null until both are provided by a market data source.
 */
function getMarketRiskInputs(
  marketResult: MarketStatusResult,
): { volume24hUsd: number; holderConcentrationPercent: number } | null {
  const volume = readOptionalNumber(marketResult.volume24hUsd)
  const holderConcentration = readOptionalNumber(
    marketResult.topHolderConcentrationPercent,
  )

  if (volume === null || holderConcentration === null) {
    return null
  }

  return {
    volume24hUsd: volume,
    holderConcentrationPercent: holderConcentration,
  }
}

function readOptionalNumber(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return value
}

export function computeLaunchMarketRisk(
  marketResult: MarketStatusResult | null | undefined,
): LaunchMarketRiskAssessment {
  if (!marketResult) {
    return {
      loaded: false,
      available: false,
      riskLevel: null,
      message: null,
    }
  }

  const inputs = getMarketRiskInputs(marketResult)

  if (!inputs) {
    return {
      loaded: true,
      available: false,
      riskLevel: 'UNKNOWN',
      message: MARKET_RISK_UNAVAILABLE_MESSAGE,
    }
  }

  // Reserved for future scoring once real holder and volume feeds are wired.
  return {
    loaded: true,
    available: true,
    riskLevel: 'UNKNOWN',
    message: MARKET_RISK_UNAVAILABLE_MESSAGE,
  }
}
