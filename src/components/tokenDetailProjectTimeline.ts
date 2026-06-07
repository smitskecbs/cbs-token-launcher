import type { Launch } from '../types/launch'
import type { LaunchUpdate } from '../types/launchUpdate'
import { fetchLaunchUpdates } from '../services/launchUpdatesService'
import { getLaunchUpdateTarget } from '../utils/launchUpdateTarget'
import { escapeHtml } from '../utils/html'
import { formatRelativeTime } from '../utils/formatRelativeTime'

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

function sortUpdatesNewestFirst(updates: LaunchUpdate[]): LaunchUpdate[] {
  return [...updates].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

function renderTimelineItem(update: LaunchUpdate): string {
  const title = escapeHtml(update.title)
  const preview = escapeHtml(truncateContentPreview(update.content))
  const createdAt = escapeHtml(update.createdAt)
  const dateLabel = escapeHtml(formatUpdateDate(update.createdAt))
  const relativeTime = formatRelativeTime(update.createdAt)
  const relativeMarkup = relativeTime
    ? `<span class="project-timeline__relative">${escapeHtml(relativeTime)}</span>`
    : ''

  return `
    <li class="project-timeline__item">
      <span class="project-timeline__marker" aria-hidden="true"></span>
      <div class="project-timeline__content">
        <h3 class="project-timeline__title">${title}</h3>
        <p class="project-timeline__preview">${preview}</p>
        <p class="project-timeline__meta">
          <time datetime="${createdAt}">${dateLabel}</time>
          ${relativeMarkup}
        </p>
      </div>
    </li>
  `
}

function renderProjectTimeline(updates: LaunchUpdate[]): string {
  const sorted = sortUpdatesNewestFirst(updates)

  if (sorted.length === 0) {
    return `
      <p class="project-timeline__empty" data-token-detail-project-timeline-empty>
        No project updates have been posted yet.
      </p>
    `
  }

  return `
    <ol class="project-timeline" data-token-detail-project-timeline-list>
      ${sorted.map(renderTimelineItem).join('')}
    </ol>
  `
}

export function renderTokenDetailProjectTimeline(launch: Launch): string {
  const id = escapeHtml(launch.id)

  return `
    <section
      class="token-detail-section token-detail-project-timeline"
      data-token-detail-project-timeline
      data-launch-id="${id}"
    >
      <h2 class="token-detail-heading">Project Timeline</h2>
      <div
        class="token-detail-project-timeline-body"
        data-token-detail-project-timeline-body
        aria-live="polite"
      >
        <p class="project-timeline__loading">Loading project timeline…</p>
      </div>
    </section>
  `
}

export function attachTokenDetailProjectTimeline(launch: Launch): void {
  const body = document.querySelector<HTMLElement>(
    `[data-token-detail-project-timeline][data-launch-id="${launch.id}"] [data-token-detail-project-timeline-body]`,
  )

  if (!body) {
    return
  }

  void loadTokenDetailProjectTimeline(launch, body)
}

async function loadTokenDetailProjectTimeline(
  launch: Launch,
  body: HTMLElement,
): Promise<void> {
  const result = await fetchLaunchUpdates(getLaunchUpdateTarget(launch))

  if (!result.ok) {
    body.innerHTML = `
      <p class="project-timeline__error">
        ${escapeHtml(result.message)}
      </p>
    `
    return
  }

  body.innerHTML = renderProjectTimeline(result.updates)
}
