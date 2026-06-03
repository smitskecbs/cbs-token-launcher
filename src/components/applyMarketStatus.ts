import type { Launch } from '../types/launch'
import type { MarketStatusResult } from '../types/marketStatus'
import { MARKET_STATUS } from '../types/marketStatus'
import { refreshLaunchAnalytics } from '../services/refreshLaunchAnalytics'
import { refreshLaunchRisk } from '../services/refreshLaunchRisk'
import { formatLiquidityUsd } from '../utils/formatLiquidityUsd'
import { formatTokenPriceUsd } from '../utils/formatTokenPrice'
import { escapeHtml } from '../utils/html'

const EMPTY = '—'

export function applyMarketStatus(
  launch: Launch,
  result: MarketStatusResult,
): void {
  applyMarketStatusToRoot(
    document.querySelector<HTMLElement>(
      `[data-token-card="${launch.id}"]`,
    ),
    result,
  )

  applyMarketStatusToRoot(
    document.querySelector<HTMLElement>(
      `[data-token-detail="${launch.id}"] [data-market-status-root]`,
    ),
    result,
  )

  refreshLaunchAnalytics(launch)
  refreshLaunchRisk(launch)
}

export function setMarketStatusChecking(launch: Launch): void {
  const checking = MARKET_STATUS.CHECKING
  const checkingDisplay = {
    tradingStatus: checking,
    poolStatus: checking,
    price: checking,
    pairHtml: `<span class="market-pair-empty">${escapeHtml(checking)}</span>`,
    liquidity: checking,
  }

  applyMarketStatusFields(
    document.querySelector<HTMLElement>(
      `[data-token-card="${launch.id}"]`,
    ),
    checkingDisplay,
  )

  applyMarketStatusFields(
    document.querySelector<HTMLElement>(
      `[data-token-detail="${launch.id}"] [data-market-status-root]`,
    ),
    checkingDisplay,
  )
}

function applyMarketStatusToRoot(
  root: HTMLElement | null,
  result: MarketStatusResult,
): void {
  if (!root) {
    return
  }

  applyMarketStatusFields(root, {
    tradingStatus: result.tradingStatus,
    poolStatus: result.poolStatus,
    price: renderPriceText(result),
    pairHtml: renderPairHtml(result),
    liquidity: renderLiquidityText(result),
  })
}

function renderPriceText(result: MarketStatusResult): string {
  if (result.error && result.priceUsd === null) {
    return MARKET_STATUS.UNAVAILABLE
  }

  if (result.priceUsd === null) {
    return EMPTY
  }

  return formatTokenPriceUsd(result.priceUsd)
}

function renderLiquidityText(result: MarketStatusResult): string {
  if (result.error && result.liquidityUsd === null) {
    return MARKET_STATUS.UNAVAILABLE
  }

  if (result.liquidityUsd === null) {
    return EMPTY
  }

  return formatLiquidityUsd(result.liquidityUsd)
}

function renderPairHtml(result: MarketStatusResult): string {
  if (result.error && !result.tradable) {
    return `<span class="market-pair-empty">${escapeHtml(MARKET_STATUS.UNAVAILABLE)}</span>`
  }

  if (result.pairName && result.tradable) {
    const pairName = escapeHtml(result.pairName)

    if (result.pairUrl) {
      return `
        <span class="market-pair-name">${pairName}</span>
        <a class="market-pair-link" href="${escapeHtml(result.pairUrl)}" target="_blank" rel="noopener noreferrer">Dexscreener</a>
      `
    }

    return `<span class="market-pair-name">${pairName}</span>`
  }

  if (result.poolDataNote) {
    return `<span class="market-pair-empty">${escapeHtml(result.poolDataNote)}</span>`
  }

  if (!result.tradable) {
    return `<span class="market-pair-empty">${escapeHtml(MARKET_STATUS.NO_PAIR)}</span>`
  }

  return `<span class="market-pair-empty">${escapeHtml(EMPTY)}</span>`
}

interface MarketStatusDisplay {
  tradingStatus: string
  poolStatus: string
  price: string
  pairHtml: string
  liquidity: string
}

function applyMarketStatusFields(
  root: HTMLElement | null,
  display: MarketStatusDisplay,
): void {
  if (!root) {
    return
  }

  setText(root, '[data-market-trading-status]', display.tradingStatus)
  setText(root, '[data-market-pool-status]', display.poolStatus)
  setText(root, '[data-market-price]', display.price)
  setText(root, '[data-market-liquidity]', display.liquidity)
  setPairHtml(root, display.pairHtml)
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

function setPairHtml(root: HTMLElement, html: string): void {
  const element = root.querySelector<HTMLElement>('[data-market-pair]')

  if (element) {
    element.innerHTML = html
  }
}
