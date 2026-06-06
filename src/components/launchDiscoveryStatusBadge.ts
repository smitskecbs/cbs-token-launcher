import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'
import {
  getDiscoveryCardStatusBadgeId,
  getDiscoveryCardStatusLabel,
} from '../utils/launchDetailDisplay'

export function renderDiscoveryStatusBadge(launch: Launch): string {
  const label = getDiscoveryCardStatusLabel(launch)
  const badgeId = getDiscoveryCardStatusBadgeId(label)

  return `
    <div class="launch-discovery-card__status" data-launch-discovery-status>
      <span class="launch-badge launch-badge--${escapeHtml(badgeId)}">
        ${escapeHtml(label)}
      </span>
    </div>
  `
}
