import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'
import {
  getLaunchBuyUrl,
  isLaunchLiveForBuy,
} from '../utils/launchBuyLink'

export function renderTokenDetailBuySection(launch: Launch): string {
  if (!isLaunchLiveForBuy(launch)) {
    return `
      <div class="token-detail-buy-section" data-token-detail-buy>
        <p class="token-detail-buy-note">
          This launch is not live yet.
        </p>
      </div>
    `
  }

  const buyUrl = getLaunchBuyUrl(launch)

  if (buyUrl) {
    return `
      <div class="token-detail-buy-section" data-token-detail-buy>
        <a
          class="primary-btn token-detail-buy-btn"
          href="${escapeHtml(buyUrl)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy Token
        </a>
      </div>
    `
  }

  return `
    <div
      class="token-detail-buy-section token-detail-buy-section--pending"
      data-token-detail-buy
      hidden
    >
      <p
        class="token-detail-buy-note"
        data-token-detail-buy-unavailable
        hidden
      >
        Buy link not available yet.
      </p>
    </div>
  `
}

export function applyTokenDetailBuySection(
  launch: Launch,
  options: { poolExists: boolean | null },
): void {
  if (!isLaunchLiveForBuy(launch) || getLaunchBuyUrl(launch)) {
    return
  }

  const section = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"] [data-token-detail-buy]`,
  )

  if (!section) {
    return
  }

  const unavailable = section.querySelector<HTMLElement>(
    '[data-token-detail-buy-unavailable]',
  )

  if (options.poolExists === true) {
    section.hidden = true

    if (unavailable) {
      unavailable.hidden = true
    }

    return
  }

  if (options.poolExists === false) {
    section.hidden = false

    if (unavailable) {
      unavailable.hidden = false
    }

    return
  }

  section.hidden = true

  if (unavailable) {
    unavailable.hidden = true
  }
}
