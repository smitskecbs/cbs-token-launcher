import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import { escapeHtml } from '../utils/html'
import { isLaunchLiveForBuy } from '../utils/launchBuyLink'
import {
  formatMarketLiquidity,
  formatMarketPrice,
  formatMarketVolume,
} from '../utils/marketDataDisplay'

const EMPTY_VALUE = '—'

export function renderTokenDetailMarketOverview(launch: Launch): string {
  if (!isLaunchLiveForBuy(launch)) {
    return ''
  }

  const id = escapeHtml(launch.id)

  return `
    <section
      class="token-detail-section token-detail-market-overview"
      data-token-detail-market-overview="${id}"
      aria-label="Market overview"
    >
      <h2 class="token-detail-heading">Market Overview</h2>
      <div class="token-detail-market-overview__body" data-token-market-overview-body>
        <p class="token-detail-market-overview__loading" data-token-market-overview-loading>
          Loading market data…
        </p>
        <dl
          class="token-detail-details token-detail-market-overview__stats"
          data-token-market-overview-stats
          hidden
        >
          <div class="token-detail-row">
            <dt>Current price</dt>
            <dd data-token-market-overview-price>${EMPTY_VALUE}</dd>
          </div>
          <div class="token-detail-row">
            <dt>Liquidity</dt>
            <dd data-token-market-overview-liquidity>${EMPTY_VALUE}</dd>
          </div>
          <div class="token-detail-row">
            <dt>24h volume</dt>
            <dd data-token-market-overview-volume>${EMPTY_VALUE}</dd>
          </div>
          <div class="token-detail-row">
            <dt>DEX</dt>
            <dd data-token-market-overview-dex>${EMPTY_VALUE}</dd>
          </div>
          <div class="token-detail-row token-detail-row--full">
            <dt>Trading pair</dt>
            <dd data-token-market-overview-pair>${EMPTY_VALUE}</dd>
          </div>
        </dl>
        <p
          class="token-detail-market-overview__unavailable"
          data-token-market-overview-unavailable
          hidden
        >
          Market data unavailable.
        </p>
        <p
          class="token-detail-market-overview__error"
          data-token-market-overview-error
          hidden
          aria-live="polite"
        ></p>
      </div>
    </section>
  `
}

function getOverviewRoot(launch: Launch): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"] [data-token-market-overview-body]`,
  )
}

export function setTokenDetailMarketOverviewLoading(launch: Launch): void {
  const root = getOverviewRoot(launch)

  if (!root) {
    return
  }

  const loading = root.querySelector<HTMLElement>(
    '[data-token-market-overview-loading]',
  )
  const stats = root.querySelector<HTMLElement>(
    '[data-token-market-overview-stats]',
  )
  const unavailable = root.querySelector<HTMLElement>(
    '[data-token-market-overview-unavailable]',
  )
  const error = root.querySelector<HTMLElement>(
    '[data-token-market-overview-error]',
  )

  if (loading) {
    loading.hidden = false
  }

  if (stats) {
    stats.hidden = true
  }

  if (unavailable) {
    unavailable.hidden = true
  }

  if (error) {
    error.hidden = true
    error.textContent = ''
  }
}

export function applyTokenDetailMarketOverview(
  launch: Launch,
  data: TokenMarketData,
): void {
  const root = getOverviewRoot(launch)

  if (!root) {
    return
  }

  const loading = root.querySelector<HTMLElement>(
    '[data-token-market-overview-loading]',
  )
  const stats = root.querySelector<HTMLElement>(
    '[data-token-market-overview-stats]',
  )
  const unavailable = root.querySelector<HTMLElement>(
    '[data-token-market-overview-unavailable]',
  )
  const error = root.querySelector<HTMLElement>(
    '[data-token-market-overview-error]',
  )

  if (loading) {
    loading.hidden = true
  }

  if (error) {
    error.hidden = true
    error.textContent = ''
  }

  if (!data.poolExists) {
    if (stats) {
      stats.hidden = true
    }

    if (unavailable) {
      unavailable.hidden = false
    }

    return
  }

  if (unavailable) {
    unavailable.hidden = true
  }

  if (stats) {
    stats.hidden = false
  }

  const setText = (selector: string, value: string): void => {
    const element = root.querySelector<HTMLElement>(selector)

    if (element) {
      element.textContent = value
    }
  }

  setText(
    '[data-token-market-overview-price]',
    formatMarketPrice(data.priceUsd),
  )
  setText(
    '[data-token-market-overview-liquidity]',
    formatMarketLiquidity(data.liquidityUsd),
  )
  setText(
    '[data-token-market-overview-volume]',
    formatMarketVolume(data.volume24hUsd),
  )
  setText('[data-token-market-overview-dex]', data.dexName ?? EMPTY_VALUE)
  setText('[data-token-market-overview-pair]', data.pairName ?? EMPTY_VALUE)
}

export function setTokenDetailMarketOverviewError(
  launch: Launch,
  message: string,
): void {
  const root = getOverviewRoot(launch)

  if (!root) {
    return
  }

  const loading = root.querySelector<HTMLElement>(
    '[data-token-market-overview-loading]',
  )
  const stats = root.querySelector<HTMLElement>(
    '[data-token-market-overview-stats]',
  )
  const unavailable = root.querySelector<HTMLElement>(
    '[data-token-market-overview-unavailable]',
  )
  const error = root.querySelector<HTMLElement>(
    '[data-token-market-overview-error]',
  )

  if (loading) {
    loading.hidden = true
  }

  if (stats) {
    stats.hidden = true
  }

  if (unavailable) {
    unavailable.hidden = true
  }

  if (error) {
    error.hidden = false
    error.textContent = message
  }
}
