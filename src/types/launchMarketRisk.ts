export type LaunchMarketRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN'

export interface LaunchMarketRiskAssessment {
  loaded: boolean
  /** True when holder concentration and volume inputs are available */
  available: boolean
  riskLevel: LaunchMarketRiskLevel | null
  message: string | null
}

export const MARKET_RISK_UNAVAILABLE_MESSAGE =
  'Market risk analysis is not available yet.'
