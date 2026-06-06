import type { Launch } from '../types/launch'
import type { LaunchUpdate } from '../types/launchUpdate'
import { getLaunchDisplayName } from './applyLaunchCardMetadata'
import { escapeHtml } from '../utils/html'
import { getTokenDetailPath } from '../router'
import { renderTokenLogo } from './tokenLogo'
import {
  resolveLatestUpdates,
  type ResolvedLatestUpdate,
} from '../services/resolveLatestUpdates'

const CONTENT_PREVIEW_MAX_LENGTH = 120

function formatUpdateDate(iso: string): string {
  const parsed = new Date(iso)

  if (Number.isNaN(parsed.getTime())) {
    return iso
  }

  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function truncateContentPreview(content: string): string {
  const trimmed = content.trim()

  if (trimmed.length <= CONTENT_PREVIEW_MAX_LENGTH) {
    return trimmed
  }

  return `${trimmed.slice(0, CONTENT_PREVIEW_MAX_LENGTH).trimEnd()}…`
}

function renderLatestUpdateCard({ update, launch }: ResolvedLatestUpdate): string {
  const launchName = escapeHtml(getLaunchDisplayName(launch))
  const title = escapeHtml(update.title)
  const preview = escapeHtml(truncateContentPreview(update.content))
  const date = escapeHtml(formatUpdateDate(update.createdAt))
  const detailPath = escapeHtml(getTokenDetailPath(launch.id))

  return `
    <article class="launch-card latest-update-card">
      <div class="latest-update-card__launch">
        ${renderTokenLogo(launch)}
        <p class="latest-update-card__launch-name">${launchName}</p>
      </div>
      <time
        class="latest-update-card__date"
        datetime="${escapeHtml(update.createdAt)}"
      >
        ${date}
      </time>
      <h3 class="latest-update-card__title">${title}</h3>
      <p class="latest-update-card__preview">${preview}</p>
      <div class="latest-update-card__actions">
        <a
          class="primary-btn latest-update-card__cta"
          href="${detailPath}"
          data-router-link
        >
          View Details
        </a>
      </div>
    </article>
  `
}

function renderLatestUpdatesEmptyState(): string {
  return `
    <article class="launch-card launch-card--placeholder latest-update-card latest-update-card--empty">
      <p class="coming-soon-text latest-update-card__empty-text">
        Project updates will appear here.
      </p>
    </article>
  `
}

export function renderLatestUpdatesSection(
  updates: LaunchUpdate[],
  catalog: Launch[],
): string {
  const resolved = resolveLatestUpdates(updates, catalog)

  return `
    <section
      class="page-section"
      data-launch-section="latest-updates"
      aria-labelledby="latest-updates-heading"
    >
      <h2 class="section-title" id="latest-updates-heading">
        Latest Updates
      </h2>
      <div class="launch-card-list latest-updates-list">
        ${
          resolved.length > 0
            ? resolved.map(renderLatestUpdateCard).join('')
            : renderLatestUpdatesEmptyState()
        }
      </div>
    </section>
  `
}
