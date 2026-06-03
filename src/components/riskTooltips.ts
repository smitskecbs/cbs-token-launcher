const TECHNICAL_RISK_TOOLTIP =
  'Technical Risk evaluates: metadata, mint verification, authorities, pool detection'

const MARKET_RISK_TOOLTIP =
  'Market Risk will evaluate: holders, liquidity, volume, trading activity'

export function renderTechnicalRiskInfoIcon(_launchId?: string): string {
  void _launchId

  return `
    <button
      type="button"
      class="risk-info-btn risk-info-btn--technical"
      data-technical-risk-info
      aria-label="About Technical Risk"
      title="${TECHNICAL_RISK_TOOLTIP}"
    >
      <span class="risk-info-icon" aria-hidden="true">i</span>
    </button>
  `
}

export function renderMarketRiskInfoIcon(_launchId?: string): string {
  void _launchId

  return `
    <button
      type="button"
      class="risk-info-btn risk-info-btn--market"
      data-market-risk-info
      aria-label="About Market Risk"
      title="${MARKET_RISK_TOOLTIP}"
    >
      <span class="risk-info-icon" aria-hidden="true">i</span>
    </button>
  `
}
