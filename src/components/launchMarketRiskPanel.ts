import { escapeHtml } from '../utils/html'
import { renderMarketRiskInfoIcon } from './riskTooltips'

const MARKET_RISK_COMING_SOON = 'Coming Soon'

export function launchMarketRiskPanelId(launchId: string): string {
  return `launch-market-risk-${launchId}`
}

function renderMarketRiskFutureList(): string {
  const items = [
    'Holder concentration',
    'Trading volume',
    'Liquidity depth',
    'Whale wallets',
    'Market activity',
  ]

  return `
    <ul class="launch-market-risk-future">
      ${items
        .map(
          (item) =>
            `<li>${escapeHtml(item)}</li>`,
        )
        .join('')}
    </ul>
  `
}

export function renderLaunchMarketRiskPanel(
  launchId: string,
  embedded = false,
): string {
  const id = escapeHtml(launchId)
  const panelClass = embedded
    ? 'launch-market-risk-panel launch-panel--embedded'
    : 'launch-market-risk-panel'
  const heading = embedded
    ? ''
    : `
      <h4
        class="launch-info-heading launch-market-risk-heading"
        id="launch-market-risk-heading-${id}"
      >
        Market Risk
      </h4>
    `

  return `
    <section
      class="${panelClass}"
      id="${launchMarketRiskPanelId(id)}"
      aria-labelledby="launch-market-risk-heading-${id}"
    >
      ${heading}
      <dl class="launch-market-risk-details">
        <div class="launch-market-risk-row">
          <dt class="launch-overview-stat-label">
            <span>Market Risk</span>
            ${renderMarketRiskInfoIcon()}
          </dt>
          <dd class="launch-market-risk-level launch-market-risk-level--coming-soon">
            ${escapeHtml(MARKET_RISK_COMING_SOON)}
          </dd>
        </div>
      </dl>
      <p class="launch-market-risk-lead">Future analysis:</p>
      ${renderMarketRiskFutureList()}
    </section>
  `
}

export function renderLaunchOverviewMarketRisk(launchId?: string): string {
  return `
    <div class="launch-overview-market-risk" data-launch-market-risk-summary>
      <div class="launch-overview-stat">
        <dt class="launch-overview-stat-label">
          <span>Market Risk</span>
          ${renderMarketRiskInfoIcon(launchId)}
        </dt>
        <dd class="launch-market-risk-level launch-market-risk-level--coming-soon">
          ${escapeHtml(MARKET_RISK_COMING_SOON)}
        </dd>
      </div>
    </div>
  `
}
