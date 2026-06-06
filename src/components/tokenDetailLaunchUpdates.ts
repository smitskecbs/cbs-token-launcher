import type { Launch } from '../types/launch'
import type { LaunchUpdate } from '../types/launchUpdate'
import { fetchLaunchUpdates } from '../services/launchUpdatesService'
import { getLaunchUpdateTarget } from '../utils/launchUpdateTarget'
import { escapeHtml } from '../utils/html'

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

function renderUpdatesList(updates: LaunchUpdate[]): string {
  if (updates.length === 0) {
    return `
      <p class="token-detail-updates-empty" data-token-detail-updates-empty>
        No updates posted yet.
      </p>
    `
  }

  return `
    <ol class="token-detail-updates-list" data-token-detail-updates-list>
      ${updates
        .map(
          (update) => `
            <li class="token-detail-update-item">
              <time
                class="token-detail-update-date"
                datetime="${escapeHtml(update.createdAt)}"
              >
                ${escapeHtml(formatUpdateDate(update.createdAt))}
              </time>
              <h3 class="token-detail-update-title">${escapeHtml(update.title)}</h3>
              <p class="token-detail-update-content">${escapeHtml(update.content)}</p>
            </li>
          `,
        )
        .join('')}
    </ol>
  `
}

export function renderTokenDetailLaunchUpdates(launch: Launch): string {
  const id = escapeHtml(launch.id)

  return `
    <section
      class="token-detail-section token-detail-updates"
      data-token-detail-updates
      data-launch-id="${id}"
    >
      <h2 class="token-detail-heading">Launch Updates</h2>
      <div
        class="token-detail-updates-body"
        data-token-detail-updates-body
        aria-live="polite"
      >
        <p class="token-detail-updates-loading">Loading updates…</p>
      </div>
    </section>
  `
}

export function attachTokenDetailLaunchUpdates(launch: Launch): void {
  const body = document.querySelector<HTMLElement>(
    `[data-token-detail-updates][data-launch-id="${launch.id}"] [data-token-detail-updates-body]`,
  )

  if (!body) {
    return
  }

  void loadTokenDetailLaunchUpdates(launch, body)
}

async function loadTokenDetailLaunchUpdates(
  launch: Launch,
  body: HTMLElement,
): Promise<void> {
  const result = await fetchLaunchUpdates(getLaunchUpdateTarget(launch))

  if (!result.ok) {
    body.innerHTML = `
      <p class="token-detail-updates-error">
        ${escapeHtml(result.message)}
      </p>
    `
    return
  }

  body.innerHTML = renderUpdatesList(result.updates)
}
