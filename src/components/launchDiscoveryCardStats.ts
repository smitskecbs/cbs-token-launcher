import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import { escapeHtml } from '../utils/html'
import { isLaunchLiveForBuy } from '../utils/launchBuyLink'
import { formatLaunchInterestCompact } from '../utils/launchInterestLabel'
import {
  formatMarketLiquidity,
  formatMarketPrice,
  formatMarketVolume,
} from '../utils/marketDataDisplay'
import { getLaunchCardInstanceIds } from './launchCard'

const EMPTY_VALUE = '—'

function isComingSoonLaunch(launch: Launch): boolean {
  return !isLaunchLiveForBuy(launch)
}

export function renderLaunchDiscoveryCardStats(launch: Launch): string {
  if (isComingSoonLaunch(launch)) {
    const interestLabel = escapeHtml(
      formatLaunchInterestCompact(launch.interestCount ?? 0),
    )

    return `
      <div
        class="launch-discovery-card__stats launch-discovery-card__stats--interest"
        data-launch-discovery-stats
        data-launch-discovery-stats-mode="interest"
      >
        <p class="launch-discovery-interest-stat" data-launch-discovery-interest>
          ${interestLabel}
        </p>
      </div>
    `
  }

  return `
    <div
      class="launch-discovery-card__stats launch-discovery-card__stats--market"
      data-launch-discovery-stats
      data-launch-discovery-stats-mode="market"
    >
      <dl class="launch-discovery-market-stats">
        <div class="launch-discovery-market-stat">
          <dt>Price</dt>
          <dd data-launch-discovery-price>${EMPTY_VALUE}</dd>
        </div>
        <div class="launch-discovery-market-stat">
          <dt>Liquidity</dt>
          <dd data-launch-discovery-liquidity>${EMPTY_VALUE}</dd>
        </div>
        <div class="launch-discovery-market-stat">
          <dt>24h Volume</dt>
          <dd data-launch-discovery-volume>${EMPTY_VALUE}</dd>
        </div>
      </dl>
      <p
        class="launch-discovery-market-loading"
        data-launch-discovery-market-loading
        aria-live="polite"
      >
        Loading market data…
      </p>
    </div>
  `
}

function forEachDiscoveryCard(
  launchId: string,
  callback: (card: HTMLElement) => void,
): void {
  for (const instanceId of getLaunchCardInstanceIds(launchId)) {
    const card = document.querySelector<HTMLElement>(
      `[data-token-card="${instanceId}"]`,
    )

    if (card) {
      callback(card)
    }
  }
}

export function setLaunchDiscoveryCardMarketLoading(launch: Launch): void {
  if (!isLaunchLiveForBuy(launch)) {
    return
  }

  forEachDiscoveryCard(launch.id, (card) => {
    const loading = card.querySelector<HTMLElement>(
      '[data-launch-discovery-market-loading]',
    )

    if (loading) {
      loading.hidden = false
    }
  })
}

export function applyLaunchDiscoveryCardMarketData(
  launch: Launch,
  data: TokenMarketData,
): void {
  if (!isLaunchLiveForBuy(launch)) {
    return
  }

  const price = formatMarketPrice(data.priceUsd, { compact: true })
  const liquidity = formatMarketLiquidity(data.liquidityUsd)
  const volume = formatMarketVolume(data.volume24hUsd)

  forEachDiscoveryCard(launch.id, (card) => {
    const priceElement = card.querySelector<HTMLElement>(
      '[data-launch-discovery-price]',
    )
    const liquidityElement = card.querySelector<HTMLElement>(
      '[data-launch-discovery-liquidity]',
    )
    const volumeElement = card.querySelector<HTMLElement>(
      '[data-launch-discovery-volume]',
    )
    const loading = card.querySelector<HTMLElement>(
      '[data-launch-discovery-market-loading]',
    )

    if (priceElement) {
      priceElement.textContent = price
    }

    if (liquidityElement) {
      liquidityElement.textContent = liquidity
    }

    if (volumeElement) {
      volumeElement.textContent = volume
    }

    if (loading) {
      loading.hidden = true
    }
  })
}

export function updateLaunchDiscoveryCardInterest(
  launch: Launch,
  count: number,
): void {
  if (!isComingSoonLaunch(launch)) {
    return
  }

  const label = formatLaunchInterestCompact(count)

  forEachDiscoveryCard(launch.id, (card) => {
    const element = card.querySelector<HTMLElement>(
      '[data-launch-discovery-interest]',
    )

    if (element) {
      element.textContent = label
    }
  })
}
