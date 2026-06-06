import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import { getCachedTokenMarketData } from '../services/tokenMarketDataCache'
import { escapeHtml } from '../utils/html'
import {
  resolvePoolTradingState,
  type PoolTradingState,
} from '../utils/resolvePoolTradingState'

function renderActionButton(
  label: string,
  href: string,
  variant: 'primary' | 'secondary' = 'secondary',
): string {
  const className =
    variant === 'primary' ? 'primary-btn' : 'secondary-btn'

  return `
    <a
      class="${className}"
      href="${escapeHtml(href)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${escapeHtml(label)}
    </a>
  `
}

function renderPoolActions(state: PoolTradingState): string {
  const actions: string[] = []

  if (!state.hasPool) {
    actions.push(
      renderActionButton(
        'Create Pool on Raydium',
        state.raydiumPoolCreationUrl,
        'primary',
      ),
    )

    return actions.join('')
  }

  if (state.viewPoolUrl) {
    actions.push(renderActionButton('View Pool', state.viewPoolUrl, 'secondary'))
  }

  if (state.raydiumTradeUrl) {
    actions.push(
      renderActionButton(
        'Trade on Raydium',
        state.raydiumTradeUrl,
        'primary',
      ),
    )
  }

  if (state.raydiumAddLiquidityUrl) {
    actions.push(
      renderActionButton(
        'Add Liquidity',
        state.raydiumAddLiquidityUrl,
        'secondary',
      ),
    )
  }

  if (state.jupiterUrl) {
    actions.push(
      renderActionButton('Buy on Jupiter', state.jupiterUrl, 'primary'),
    )
  }

  if (state.dexscreenerUrl) {
    actions.push(
      renderActionButton('Dexscreener', state.dexscreenerUrl, 'secondary'),
    )
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
