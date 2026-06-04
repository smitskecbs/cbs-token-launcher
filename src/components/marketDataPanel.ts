import type { Launch } from '../types/launch'
import {
  MARKET_DATA_COMING_SOON,
  MARKET_DATA_UNAVAILABLE,
} from '../types/marketData'
import { escapeHtml } from '../utils/html'
import { renderCreatePoolAction } from './createPoolModal'
import { renderLaunchMarketRiskPanel } from './launchMarketRiskPanel'

const INITIAL_VALUE = '—'

export function renderMarketDataPanel(launch: Launch): string {
  const info = launch.launchInfo

  return `
    <div class="market-data-panel" data-market-data-root>
      ${renderMarketDataFields({
        tradingStatus: info.tradingStatus,
        poolStatus: info.poolStatus,
      })}
      ${renderCreatePoolAction(launch)}
      ${renderMarketDataHolderPlaceholders()}
    </div>
    ${renderLaunchMarketRiskPanel(launch.id, true)}
  `
}

export function renderMarketDataFields(options: {
  tradingStatus: string
  poolStatus: string
  rowClass?: string
}): string {
  const tradingStatus = escapeHtml(options.tradingStatus)
  const poolStatus = escapeHtml(options.poolStatus)
  const rowClass = options.rowClass ?? 'market-data-row launch-info-row'

  return `
    <dl class="market-data-details launch-info-details">
      <div class="${rowClass}">
        <dt>Price</dt>
        <dd class="market-data-value" data-market-detail-price>${INITIAL_VALUE}</dd>
      </div>
      <div class="${rowClass}">
        <dt>Liquidity</dt>
        <dd class="market-data-value" data-market-detail-liquidity>${INITIAL_VALUE}</dd>
      </div>
      <div class="${rowClass} market-data-row--full">
        <dt>Main Pair</dt>
        <dd class="market-data-value market-pair-value" data-market-detail-pair>${INITIAL_VALUE}</dd>
      </div>
      <div class="${rowClass}">
        <dt>Pool Status</dt>
        <dd class="market-data-value" data-market-pool-status>${poolStatus}</dd>
      </div>
      <div class="${rowClass}">
        <dt>Trading Status</dt>
        <dd class="market-data-value" data-market-trading-status>${tradingStatus}</dd>
      </div>
      <div class="${rowClass} market-data-row--full">
        <dt>Dexscreener</dt>
        <dd class="market-data-value market-dexscreener-value" data-market-dexscreener-link>${INITIAL_VALUE}</dd>
      </div>
    </dl>
  `
}

function renderMarketDataHolderPlaceholders(): string {
  const comingSoon = escapeHtml(MARKET_DATA_COMING_SOON)

  return `
    <section
      class="market-data-placeholders"
      aria-label="Holder analysis coming soon"
    >
      <h5 class="market-data-subheading">Holder Analysis</h5>
      <dl class="market-data-details launch-info-details">
        <div class="market-data-row launch-info-row">
          <dt>Holder Count</dt>
          <dd class="market-data-coming-soon">${comingSoon}</dd>
        </div>
        <div class="market-data-row launch-info-row">
          <dt>Largest Holder</dt>
          <dd class="market-data-coming-soon">${comingSoon}</dd>
        </div>
        <div class="market-data-row launch-info-row">
          <dt>Top 10 Holders</dt>
          <dd class="market-data-coming-soon">${comingSoon}</dd>
        </div>
      </dl>
    </section>
  `
}

export { MARKET_DATA_UNAVAILABLE, MARKET_DATA_COMING_SOON }
