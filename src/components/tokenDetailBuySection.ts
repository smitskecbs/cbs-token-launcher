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
    <div class="token-detail-buy-section" data-token-detail-buy>
      <p class="token-detail-buy-note">
        Buy link not available yet.
      </p>
    </div>
  `
}
