import type { Launch } from '../types/launch'
import { getTokenDetailPath } from '../router'
import { escapeHtml } from '../utils/html'

export function renderDiscoveryCardActions(launch: Launch): string {
  const detailPath = escapeHtml(getTokenDetailPath(launch.id))

  return `
    <div class="launch-discovery-card__actions">
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
