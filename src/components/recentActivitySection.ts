import type { Launch } from '../types/launch'
import type { LaunchUpdate } from '../types/launchUpdate'
import type { RecentActivityItem } from '../types/recentActivity'
import { getLaunchDisplayName } from './applyLaunchCardMetadata'
import { escapeHtml } from '../utils/html'
import { formatRelativeTime } from '../utils/formatRelativeTime'
import { readLaunchActivityLog } from '../services/launchActivityLog'
import {
  formatRecentActivityText,
  resolveRecentActivity,
} from '../services/resolveRecentActivity'
import { renderTokenLogo } from './tokenLogo'

function renderRecentActivityCard(activity: RecentActivityItem): string {
  const launchName = escapeHtml(getLaunchDisplayName(activity.launch))
  const activityText = escapeHtml(formatRecentActivityText(activity.type))
  const relativeTime = escapeHtml(formatRelativeTime(activity.occurredAt))
  const occurredAt = escapeHtml(activity.occurredAt)

  return `
    <article class="launch-card recent-activity-card">
      <div class="recent-activity-card__main">
        ${renderTokenLogo(activity.launch)}
        <div class="recent-activity-card__content">
          <p class="recent-activity-card__launch-name">${launchName}</p>
          <p class="recent-activity-card__text">${activityText}</p>
          <time
            class="recent-activity-card__time"
            datetime="${occurredAt}"
          >
            ${relativeTime}
          </time>
        </div>
      </div>
    </article>
  `
}

function renderRecentActivityEmptyState(): string {
  return `
    <article class="launch-card launch-card--placeholder recent-activity-card recent-activity-card--empty">
      <p class="coming-soon-text recent-activity-card__empty-text">
        No recent activity yet.
      </p>
    </article>
  `
}

export function renderRecentActivitySection(
  updates: LaunchUpdate[],
  catalog: Launch[],
): string {
  const activities = resolveRecentActivity(
    updates,
    catalog,
    readLaunchActivityLog(),
  )

  return `
    <section
      class="page-section"
      data-launch-section="recent-activity"
      aria-labelledby="recent-activity-heading"
    >
      <h2 class="section-title" id="recent-activity-heading">
        Recent Activity
      </h2>
      <div class="launch-card-list recent-activity-list">
        ${
          activities.length > 0
            ? activities.map(renderRecentActivityCard).join('')
            : renderRecentActivityEmptyState()
        }
      </div>
    </section>
  `
}
