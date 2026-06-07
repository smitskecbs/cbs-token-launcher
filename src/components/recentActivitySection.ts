import type { Launch } from '../types/launch'
import type { LaunchUpdate } from '../types/launchUpdate'
import type { ResolvedRecentActivityItem } from '../types/recentActivity'
import { getLaunchDisplayName } from './applyLaunchCardMetadata'
import { escapeHtml } from '../utils/html'
import { formatRelativeTime } from '../utils/formatRelativeTime'
import { readLaunchActivityLog } from '../services/launchActivityLog'
import {
  formatRecentActivityText,
  resolveRecentActivity,
  type ResolveRecentActivityOptions,
} from '../services/resolveRecentActivity'
import { renderTokenLogo } from './tokenLogo'

function renderRecentActivityCard(activity: ResolvedRecentActivityItem): string {
  const relativeTime = formatRelativeTime(activity.occurredAt)

  if (!relativeTime) {
    return ''
  }

  const launchName = escapeHtml(getLaunchDisplayName(activity.launch))
  const activityText = escapeHtml(formatRecentActivityText(activity.type))
  const occurredAt = escapeHtml(activity.occurredAt)
  const actionHref = escapeHtml(activity.navigation.href)
  const actionLabel = escapeHtml(activity.navigation.label)

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
            ${escapeHtml(relativeTime)}
          </time>
        </div>
      </div>
      <div class="recent-activity-card__actions">
        <a
          class="primary-btn recent-activity-card__cta"
          href="${actionHref}"
          data-router-link
        >
          ${actionLabel}
        </a>
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

export interface RenderRecentActivitySectionOptions
  extends ResolveRecentActivityOptions {}

export function renderRecentActivitySection(
  updates: LaunchUpdate[],
  catalog: Launch[],
  options: RenderRecentActivitySectionOptions = {},
): string {
  const activities = resolveRecentActivity(
    updates,
    catalog,
    readLaunchActivityLog(),
    options,
  )
  const renderedCards = activities
    .map(renderRecentActivityCard)
    .filter(Boolean)
    .join('')

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
        ${renderedCards || renderRecentActivityEmptyState()}
      </div>
    </section>
  `
}
