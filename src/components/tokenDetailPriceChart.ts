import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import { getDexscreenerChartEmbedUrl } from '../config/urls'
import { escapeHtml } from '../utils/html'
import { isLaunchLiveForBuy } from '../utils/launchBuyLink'
import { hasDisplayableMarketData } from '../utils/marketDataDisplay'

export function renderTokenDetailPriceChart(launch: Launch): string {
  if (!isLaunchLiveForBuy(launch)) {
    return ''
  }

  const id = escapeHtml(launch.id)

  return `
    <section
      class="token-detail-section token-detail-price-chart"
      data-token-detail-price-chart="${id}"
      aria-label="Price chart"
    >
      <div class="token-detail-price-chart__header">
        <h2 class="token-detail-heading">Price Chart</h2>
        <p class="token-detail-price-chart__subtitle">Recent market activity.</p>
      </div>
      <div class="token-detail-price-chart__body" data-token-price-chart-body>
        <p class="token-detail-price-chart__loading" data-token-price-chart-loading>
          Loading chart…
        </p>
        <div
          class="token-detail-price-chart__frame-wrap"
          data-token-price-chart-frame-wrap
          hidden
        >
          <iframe
            class="token-detail-price-chart__frame"
            data-token-price-chart-frame
            title="${escapeHtml(getDetailChartTitle(launch))} price chart"
            loading="lazy"
            referrerpolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups"
          ></iframe>
        </div>
        <p
          class="token-detail-price-chart__unavailable"
          data-token-price-chart-unavailable
          hidden
        >
          Market chart unavailable.
        </p>
        <p
          class="token-detail-price-chart__error"
          data-token-price-chart-error
          hidden
          aria-live="polite"
        ></p>
      </div>
    </section>
  `
}

function getDetailChartTitle(launch: Launch): string {
  return launch.name?.trim() || launch.symbol?.trim() || launch.id
}

function getChartRoot(launch: Launch): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"] [data-token-price-chart-body]`,
  )
}

export function setTokenDetailPriceChartLoading(launch: Launch): void {
  const root = getChartRoot(launch)

  if (!root) {
    return
  }

  setChartState(root, 'loading')
}

export function applyTokenDetailPriceChart(
  launch: Launch,
  data: TokenMarketData,
): void {
  const root = getChartRoot(launch)

  if (!root) {
    return
  }

  if (!hasDisplayableMarketData(data) || !data.pairAddress) {
    setChartState(root, 'unavailable')
    return
  }

  const frameWrap = root.querySelector<HTMLElement>(
    '[data-token-price-chart-frame-wrap]',
  )
  const frame = root.querySelector<HTMLIFrameElement>(
    '[data-token-price-chart-frame]',
  )

  if (!frame || !frameWrap) {
    setChartState(root, 'unavailable')
    return
  }

  frame.src = getDexscreenerChartEmbedUrl(data.pairAddress)
  setChartState(root, 'ready')
}

export function setTokenDetailPriceChartError(
  launch: Launch,
  message: string,
): void {
  const root = getChartRoot(launch)

  if (!root) {
    return
  }

  const loading = root.querySelector<HTMLElement>(
    '[data-token-price-chart-loading]',
  )
  const frameWrap = root.querySelector<HTMLElement>(
    '[data-token-price-chart-frame-wrap]',
  )
  const unavailable = root.querySelector<HTMLElement>(
    '[data-token-price-chart-unavailable]',
  )
  const error = root.querySelector<HTMLElement>(
    '[data-token-price-chart-error]',
  )

  if (loading) {
    loading.hidden = true
  }

  if (frameWrap) {
    frameWrap.hidden = true
  }

  if (unavailable) {
    unavailable.hidden = true
  }

  if (error) {
    error.hidden = false
    error.textContent = message
  }
}

function setChartState(
  root: HTMLElement,
  state: 'loading' | 'ready' | 'unavailable',
): void {
  const loading = root.querySelector<HTMLElement>(
    '[data-token-price-chart-loading]',
  )
  const frameWrap = root.querySelector<HTMLElement>(
    '[data-token-price-chart-frame-wrap]',
  )
  const unavailable = root.querySelector<HTMLElement>(
    '[data-token-price-chart-unavailable]',
  )
  const error = root.querySelector<HTMLElement>(
    '[data-token-price-chart-error]',
  )

  if (error) {
    error.hidden = true
    error.textContent = ''
  }

  if (loading) {
    loading.hidden = state !== 'loading'
  }

  if (frameWrap) {
    frameWrap.hidden = state !== 'ready'
  }

  if (unavailable) {
    unavailable.hidden = state !== 'unavailable'
  }
}
