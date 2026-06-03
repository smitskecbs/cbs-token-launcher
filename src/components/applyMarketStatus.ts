import type { Launch } from '../types/launch'
import type { MarketStatusResult } from '../types/marketStatus'
import { MARKET_STATUS } from '../types/marketStatus'
import { MARKET_DATA_UNAVAILABLE } from '../types/marketData'
import { refreshLaunchAnalytics } from '../services/refreshLaunchAnalytics'
import { refreshLaunchRisk } from '../services/refreshLaunchRisk'
import { formatLiquidity, hasValidMarketLiquidity } from '../utils/formatLiquidity'
import { formatPrice, hasValidMarketPrice } from '../utils/formatPrice'
import { escapeHtml } from '../utils/html'

const OVERVIEW_PENDING = '—'

export function applyMarketStatus(
  launch: Launch,
  result: MarketStatusResult,
): void {
  applyMarketOverview(
    document.querySelector<HTMLElement>(
      `[data-token-card="${launch.id}"] .launch-card-overview`,
    ),
    result,
  )

  applyMarketDataPanel(
    document.querySelector<HTMLElement>(
      `[data-token-card="${launch.id}"] [data-market-data-root]`,
    ),
    result,
  )

  applyMarketDataPanel(
    document.querySelector<HTMLElement>(
      `[data-token-detail="${launch.id}"] [data-market-data-root]`,
    ),
    result,
  )

  refreshLaunchAnalytics(launch)
  refreshLaunchRisk(launch)
}

export function setMarketStatusChecking(launch: Launch): void {
  const checking = MARKET_STATUS.CHECKING

  const overviewDisplay = {
    price: checking,
    liquidity: checking,
  }

  const detailDisplay = {
    tradingStatus: checking,
    poolStatus: checking,
    price: checking,
    pairText: checking,
    liquidity: checking,
    dexscreenerHtml: `<span class="market-data-empty">${escapeHtml(checking)}</span>`,
  }

  applyMarketOverviewFields(
    document.querySelector<HTMLElement>(
      `[data-token-card="${launch.id}"] .launch-card-overview`,
    ),
    overviewDisplay,
  )

  applyMarketDataFields(
    document.querySelector<HTMLElement>(
      `[data-token-card="${launch.id}"] [data-market-data-root]`,
    ),
    detailDisplay,
  )

  applyMarketDataFields(
    document.querySelector<HTMLElement>(
      `[data-token-detail="${launch.id}"] [data-market-data-root]`,
    ),
    detailDisplay,
  )
}

function applyMarketOverview(
  root: HTMLElement | null,
  result: MarketStatusResult,
): void {
  if (!root) {
    return
  }

  applyMarketOverviewFields(root, {
    price: renderOverviewPriceText(result),
    liquidity: renderOverviewLiquidityText(result),
  })
}

function applyMarketDataPanel(
  root: HTMLElement | null,
  result: MarketStatusResult,
): void {
  if (!root) {
    return
  }

  applyMarketDataFields(root, {
    tradingStatus: result.tradingStatus,
    poolStatus: result.poolStatus,
    price: renderDetailPriceText(result),
    pairText: renderMainPairText(result),
    liquidity: renderDetailLiquidityText(result),
    dexscreenerHtml: renderDexscreenerLinkHtml(result),
  })
}

function renderOverviewPriceText(result: MarketStatusResult): string {
  if (result.error && !hasValidMarketPrice(result.priceUsd)) {
    return MARKET_DATA_UNAVAILABLE
  }

  if (!hasValidMarketPrice(result.priceUsd)) {
    return OVERVIEW_PENDING
  }

  return formatPrice(result.priceUsd, { compact: true })
}

function renderOverviewLiquidityText(result: MarketStatusResult): string {
  if (result.error && !hasValidMarketLiquidity(result.liquidityUsd)) {
    return MARKET_DATA_UNAVAILABLE
  }

  if (!hasValidMarketLiquidity(result.liquidityUsd)) {
    return OVERVIEW_PENDING
  }

  return formatLiquidity(result.liquidityUsd, { compact: true })
}

function renderDetailPriceText(result: MarketStatusResult): string {
  if (!hasValidMarketPrice(result.priceUsd)) {
    return MARKET_DATA_UNAVAILABLE
  }

  return formatPrice(result.priceUsd)
}

function renderDetailLiquidityText(result: MarketStatusResult): string {
  if (!hasValidMarketLiquidity(result.liquidityUsd)) {
    return MARKET_DATA_UNAVAILABLE
  }

  return formatLiquidity(result.liquidityUsd)
}

function renderMainPairText(result: MarketStatusResult): string {
  if (result.error && !result.tradable) {
    return MARKET_DATA_UNAVAILABLE
  }

  if (result.pairName && result.tradable) {
    return result.pairName
  }

  if (result.poolDataNote) {
    return result.poolDataNote
  }

  if (!result.tradable) {
    return MARKET_STATUS.NO_PAIR
  }

  return MARKET_DATA_UNAVAILABLE
}

function renderDexscreenerLinkHtml(result: MarketStatusResult): string {
  if (result.pairUrl) {
    const url = escapeHtml(result.pairUrl)

    return `
      <a
        class="market-dexscreener-link"
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
      >View on Dexscreener</a>
    `
  }

  return `<span class="market-data-empty">${escapeHtml(MARKET_DATA_UNAVAILABLE)}</span>`
}

interface MarketOverviewDisplay {
  price: string
  liquidity: string
}

interface MarketDataDisplay {
  tradingStatus: string
  poolStatus: string
  price: string
  pairText: string
  liquidity: string
  dexscreenerHtml: string
}

function applyMarketOverviewFields(
  root: HTMLElement | null,
  display: MarketOverviewDisplay,
): void {
  if (!root) {
    return
  }

  setText(root, '[data-market-overview-price]', display.price)
  setText(root, '[data-market-overview-liquidity]', display.liquidity)
}

function applyMarketDataFields(
  root: HTMLElement | null,
  display: MarketDataDisplay,
): void {
  if (!root) {
    return
  }

  setText(root, '[data-market-trading-status]', display.tradingStatus)
  setText(root, '[data-market-pool-status]', display.poolStatus)
  setText(root, '[data-market-detail-price]', display.price)
  setText(root, '[data-market-detail-liquidity]', display.liquidity)
  setText(root, '[data-market-detail-pair]', display.pairText)
  setDexscreenerHtml(root, display.dexscreenerHtml)
}

function setText(
  root: HTMLElement,
  selector: string,
  value: string,
): void {
  for (const element of root.querySelectorAll<HTMLElement>(selector)) {
    element.textContent = value
  }
}

function setDexscreenerHtml(root: HTMLElement, html: string): void {
  const element = root.querySelector<HTMLElement>(
    '[data-market-dexscreener-link]',
  )

  if (element) {
    element.innerHTML = html
  }
}
