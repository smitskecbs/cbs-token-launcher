import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'
import {
  getLaunchJupiterTradeUrl,
  getLaunchPoolUrl,
  getLaunchRaydiumPoolCreationLink,
  getLaunchRaydiumTradeUrl,
  hasLaunchPoolUrl,
} from '../utils/launchTradingLinks'

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

export function renderTokenDetailPoolSection(launch: Launch): string {
  const poolUrl = getLaunchPoolUrl(launch)
  const hasPool = hasLaunchPoolUrl(launch)
  const poolStatus = hasPool ? 'Active' : 'No pool created yet'
  const poolStatusClass = hasPool
    ? 'token-detail-pool-status--active'
    : 'token-detail-pool-status--inactive'

  const actions: string[] = []

  if (hasPool && poolUrl) {
    actions.push(renderActionButton('View Pool', poolUrl, 'secondary'))

    const raydiumTradeUrl = getLaunchRaydiumTradeUrl(launch)

    if (raydiumTradeUrl) {
      actions.push(
        renderActionButton('Trade on Raydium', raydiumTradeUrl, 'primary'),
      )
    }
  } else {
    actions.push(
      renderActionButton(
        'Create Pool on Raydium',
        getLaunchRaydiumPoolCreationLink(),
        'primary',
      ),
    )
  }

  const jupiterUrl = getLaunchJupiterTradeUrl(launch)

  if (jupiterUrl) {
    actions.push(renderActionButton('Buy on Jupiter', jupiterUrl, 'primary'))
  }

  return `
    <section
      class="token-detail-section token-detail-pool"
      data-token-detail-pool
      aria-label="Pool status and trading"
    >
      <h2 class="token-detail-heading">Pool &amp; Trading</h2>
      <dl class="token-detail-details token-detail-pool-details">
        <div class="token-detail-row">
          <dt>Pool Status</dt>
          <dd
            class="token-detail-pool-status ${poolStatusClass}"
            data-token-detail-pool-status
          >
            ${escapeHtml(poolStatus)}
          </dd>
        </div>
      </dl>
      ${
        actions.length > 0
          ? `
            <div class="token-detail-pool-actions actions">
              ${actions.join('')}
            </div>
          `
          : ''
      }
    </section>
  `
}
