import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import { getCachedTokenMarketData } from '../services/tokenMarketDataCache'
import { renderExternalAnchorHtml } from '../utils/externalLink'
import { escapeHtml } from '../utils/html'
import {
  resolvePoolTradingState,
  type PoolTradingState,
} from '../utils/resolvePoolTradingState'

function renderPoolActions(state: PoolTradingState): string {
  const actions: string[] = []

  if (!state.hasPool) {
    const createPool = renderExternalAnchorHtml(
      state.raydiumPoolCreationUrl,
      'Create Pool on Raydium',
      'primary-btn',
    )

    if (createPool) {
      actions.push(createPool)
    }

    return actions.join('')
  }

  if (state.viewPoolUrl) {
    const viewPool = renderExternalAnchorHtml(
      state.viewPoolUrl,
      'View Pool',
      'secondary-btn',
    )

    if (viewPool) {
      actions.push(viewPool)
    }
  }

  if (state.raydiumTradeUrl) {
    const trade = renderExternalAnchorHtml(
      state.raydiumTradeUrl,
      'Trade on Raydium',
      'primary-btn',
    )

    if (trade) {
      actions.push(trade)
    }
  }

  if (state.raydiumAddLiquidityUrl) {
    const addLiquidity = renderExternalAnchorHtml(
      state.raydiumAddLiquidityUrl,
      'Add Liquidity',
      'secondary-btn',
    )

    if (addLiquidity) {
      actions.push(addLiquidity)
    }
  }

  if (state.jupiterUrl) {
    const jupiter = renderExternalAnchorHtml(
      state.jupiterUrl,
      'Buy on Jupiter',
      'primary-btn',
    )

    if (jupiter) {
      actions.push(jupiter)
    }
  }

  if (state.dexscreenerUrl) {
    const dexscreener = renderExternalAnchorHtml(
      state.dexscreenerUrl,
      'Dexscreener',
      'secondary-btn',
    )

    if (dexscreener) {
      actions.push(dexscreener)
    }
  }

  return actions.join('')
}

function renderPoolSectionBody(state: PoolTradingState): string {
  const poolStatusClass = state.hasPool
    ? 'token-detail-pool-status--active'
    : 'token-detail-pool-status--inactive'
  const actions = renderPoolActions(state)

  return `
    <dl class="token-detail-details token-detail-pool-details">
      <div class="token-detail-row">
        <dt>Pool Status</dt>
        <dd
          class="token-detail-pool-status ${poolStatusClass}"
          data-token-detail-pool-status
        >
          ${escapeHtml(state.poolStatusLabel)}
        </dd>
      </div>
    </dl>
    ${
      actions
        ? `
          <div class="token-detail-pool-actions actions" data-token-detail-pool-actions>
            ${actions}
          </div>
        `
        : ''
    }
  `
}

export function renderTokenDetailPoolSection(launch: Launch): string {
  const cachedMarketData = getCachedTokenMarketData(launch.mintAddress)
  const state = resolvePoolTradingState(launch, cachedMarketData)
  const id = escapeHtml(launch.id)

  return `
    <section
      class="token-detail-section token-detail-pool"
      data-token-detail-pool
      data-token-detail-pool-launch="${id}"
      aria-label="Pool status and trading"
    >
      <h2 class="token-detail-heading">Pool &amp; Trading</h2>
      <div data-token-detail-pool-body>
        ${renderPoolSectionBody(state)}
      </div>
    </section>
  `
}

export function applyTokenDetailPoolSection(
  launch: Launch,
  marketData?: TokenMarketData | null,
): void {
  const body = document.querySelector<HTMLElement>(
    `[data-token-detail-pool-launch="${launch.id}"] [data-token-detail-pool-body]`,
  )

  if (!body) {
    return
  }

  const resolvedMarketData =
    marketData ?? getCachedTokenMarketData(launch.mintAddress) ?? null
  const state = resolvePoolTradingState(launch, resolvedMarketData)

  body.innerHTML = renderPoolSectionBody(state)
}
