import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import { getJupiterSwapUrl } from '../config/urls'
import { resolveDexscreenerUrl } from '../utils/dexscreenerUrl'
import { formatLiquidity } from '../utils/formatLiquidity'
import { formatPrice } from '../utils/formatPrice'
import { isLaunchLiveForBuy } from '../utils/launchBuyLink'
import { applyTokenDetailBuySection } from './tokenDetailBuySection'
import { applyTokenDetailPoolSection } from './tokenDetailPoolSection'

const EMPTY_VALUE = '—'

function formatVolume(volumeUsd: number | null): string {
  if (typeof volumeUsd !== 'number' || !Number.isFinite(volumeUsd) || volumeUsd <= 0) {
    return EMPTY_VALUE
  }

  return formatLiquidity(volumeUsd)
}

function formatPairAddress(pairAddress: string | null): string {
  if (!pairAddress) {
    return EMPTY_VALUE
  }

  if (pairAddress.length <= 14) {
    return pairAddress
  }

  return `${pairAddress.slice(0, 6)}…${pairAddress.slice(-6)}`
}

function resolveTradingDexscreenerUrl(
  launch: Launch,
  data: TokenMarketData,
): string | null {
  return resolveDexscreenerUrl({
    pairUrl: data.pairUrl,
    pairAddress: data.pairAddress,
    mintAddress: launch.mintAddress,
    allowTokenFallback: data.poolExists,
  })
}

export function renderTokenDetailTradingSection(launch: Launch): string {
  if (!isLaunchLiveForBuy(launch)) {
    return ''
  }

  return `
    <section
      class="token-detail-section token-detail-trading"
      data-token-detail-trading
      aria-label="Trading availability"
    >
      <h2 class="token-detail-heading">Trading</h2>
      <div class="token-detail-trading-body" data-token-detail-trading-body>
        <p class="token-detail-trading-loading" data-token-detail-trading-loading>
          Checking trading status…
        </p>
        <div data-token-detail-trading-available hidden>
          <p class="token-detail-trading-status token-detail-trading-status--available">
            ✓ Trading available
          </p>
          <dl class="token-detail-details token-detail-trading-stats">
            <div class="token-detail-row">
              <dt>DEX</dt>
              <dd data-token-trading-dex>${EMPTY_VALUE}</dd>
            </div>
            <div class="token-detail-row">
              <dt>Pair</dt>
              <dd data-token-trading-pair>${EMPTY_VALUE}</dd>
            </div>
            <div class="token-detail-row token-detail-row--full">
              <dt>Pair Address</dt>
              <dd data-token-trading-pair-address>${EMPTY_VALUE}</dd>
            </div>
            <div class="token-detail-row">
              <dt>Liquidity</dt>
              <dd data-token-trading-liquidity>${EMPTY_VALUE}</dd>
            </div>
            <div class="token-detail-row">
              <dt>Price</dt>
              <dd data-token-trading-price>${EMPTY_VALUE}</dd>
            </div>
            <div class="token-detail-row">
              <dt>24h Volume</dt>
              <dd data-token-trading-volume>${EMPTY_VALUE}</dd>
            </div>
          </dl>
          <div class="token-detail-trading-actions actions">
            <a
              class="secondary-btn"
              data-token-trading-dexscreener-link
              hidden
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Dexscreener
            </a>
            <a
              class="primary-btn"
              data-token-trading-jupiter-link
              hidden
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy on Jupiter
            </a>
          </div>
        </div>
        <p
          class="token-detail-trading-note"
          data-token-detail-trading-unavailable
          hidden
        >
          No liquidity pool detected yet.
        </p>
        <p
          class="token-detail-trading-error"
          data-token-detail-trading-error
          hidden
          aria-live="polite"
        ></p>
      </div>
    </section>
  `
}

function setText(
  root: ParentNode,
  selector: string,
  value: string,
): void {
  const element = root.querySelector<HTMLElement>(selector)

  if (element) {
    element.textContent = value
  }
}

export function setTokenDetailTradingLoading(launch: Launch): void {
  const root = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"] [data-token-detail-trading-body]`,
  )

  if (!root) {
    return
  }

  const loading = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-loading]',
  )
  const available = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-available]',
  )
  const unavailable = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-unavailable]',
  )
  const error = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-error]',
  )

  if (loading) {
    loading.hidden = false
  }

  if (available) {
    available.hidden = true
  }

  if (unavailable) {
    unavailable.hidden = true
  }

  if (error) {
    error.hidden = true
    error.textContent = ''
  }

  applyTokenDetailBuySection(launch, { poolExists: null })
}

export function applyTokenDetailTradingData(
  launch: Launch,
  data: TokenMarketData,
): void {
  const root = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"] [data-token-detail-trading-body]`,
  )

  if (!root) {
    return
  }

  const loading = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-loading]',
  )
  const available = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-available]',
  )
  const unavailable = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-unavailable]',
  )
  const error = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-error]',
  )

  if (loading) {
    loading.hidden = true
  }

  if (error) {
    error.hidden = true
    error.textContent = ''
  }

  if (!data.poolExists) {
    if (available) {
      available.hidden = true
    }

    if (unavailable) {
      unavailable.hidden = false
    }

    applyTokenDetailBuySection(launch, { poolExists: false })
    applyTokenDetailPoolSection(launch, data)
    return
  }

  if (unavailable) {
    unavailable.hidden = true
  }

  if (available) {
    available.hidden = false
  }

  setText(root, '[data-token-trading-dex]', data.dexName ?? EMPTY_VALUE)
  setText(root, '[data-token-trading-pair]', data.pairName ?? EMPTY_VALUE)
  setText(
    root,
    '[data-token-trading-pair-address]',
    formatPairAddress(data.pairAddress),
  )
  setText(
    root,
    '[data-token-trading-liquidity]',
    data.liquidityUsd !== null ? formatLiquidity(data.liquidityUsd) : EMPTY_VALUE,
  )
  setText(
    root,
    '[data-token-trading-price]',
    data.priceUsd !== null ? formatPrice(data.priceUsd) : EMPTY_VALUE,
  )
  setText(root, '[data-token-trading-volume]', formatVolume(data.volume24hUsd))

  const dexscreenerUrl = resolveTradingDexscreenerUrl(launch, data)
  const dexscreenerLink = root.querySelector<HTMLAnchorElement>(
    '[data-token-trading-dexscreener-link]',
  )

  if (dexscreenerLink) {
    if (dexscreenerUrl) {
      dexscreenerLink.href = dexscreenerUrl
      dexscreenerLink.hidden = false
    } else {
      dexscreenerLink.removeAttribute('href')
      dexscreenerLink.hidden = true
    }
  }

  const jupiterLink = root.querySelector<HTMLAnchorElement>(
    '[data-token-trading-jupiter-link]',
  )

  if (jupiterLink) {
    const jupiterUrl = getJupiterSwapUrl(launch.mintAddress)
    jupiterLink.href = jupiterUrl
    jupiterLink.hidden = false
  }

  applyTokenDetailBuySection(launch, { poolExists: true })
  applyTokenDetailPoolSection(launch, data)
}

export function setTokenDetailTradingError(
  launch: Launch,
  message: string,
): void {
  const root = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"] [data-token-detail-trading-body]`,
  )

  if (!root) {
    return
  }

  const loading = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-loading]',
  )
  const available = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-available]',
  )
  const unavailable = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-unavailable]',
  )
  const error = root.querySelector<HTMLElement>(
    '[data-token-detail-trading-error]',
  )

  if (loading) {
    loading.hidden = true
  }

  if (available) {
    available.hidden = true
  }

  if (unavailable) {
    unavailable.hidden = true
  }

  if (error) {
    error.hidden = false
    error.textContent = message
  }

  applyTokenDetailBuySection(launch, { poolExists: null })
}
