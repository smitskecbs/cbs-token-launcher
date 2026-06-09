import type { Launch } from '../types/launch'
import { getTokenDetailPath } from '../router'
import { escapeHtml } from '../utils/html'
import { isLaunchLiveForBuy } from '../utils/launchBuyLink'
import { renderLaunchInterestControl } from './launchInterestControl'

export function renderDiscoveryCardActions(launch: Launch): string {
  const detailPath = escapeHtml(getTokenDetailPath(launch.id))
  const interestControl = isLaunchLiveForBuy(launch)
    ? ''
    : renderLaunchInterestControl(launch, { variant: 'card' })

  return `
    <div class="launch-discovery-card__actions">
      ${interestControl}
      <a
        class="primary-btn launch-discovery-card__cta"
        href="${detailPath}"
        data-router-link
      >
        View Details
      </a>
    </div>
  `
}
