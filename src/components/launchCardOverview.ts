import { renderTechnicalRiskInfoIcon } from './riskTooltips'
import { renderLaunchOverviewMarketRisk } from './launchMarketRiskPanel'

const EMPTY_SCORE = '—/100'
const EMPTY_VALUE = '—'
const EMPTY_LEVEL = '—'

/** Compact stats always visible at the top of launch cards */
export function renderLaunchCardOverview(launchId?: string): string {
  return `
    <dl class="launch-overview-stats">
      <div class="launch-overview-stat">
        <dt>Price</dt>
        <dd data-market-overview-price>${EMPTY_VALUE}</dd>
      </div>
      <div class="launch-overview-stat">
        <dt>Liquidity</dt>
        <dd data-market-overview-liquidity>${EMPTY_VALUE}</dd>
      </div>
      <div class="launch-overview-stat">
        <dt>Score</dt>
        <dd data-launch-overview-score>${EMPTY_SCORE}</dd>
      </div>
      <div class="launch-overview-stat">
        <dt class="launch-overview-stat-label">
          <span>Technical Risk</span>
          ${renderTechnicalRiskInfoIcon(launchId)}
        </dt>
        <dd
          class="launch-risk-level launch-risk-level--unknown"
          data-launch-overview-risk
        >${EMPTY_LEVEL}</dd>
      </div>
    </dl>
    ${renderLaunchOverviewMarketRisk(launchId)}
  `
}
