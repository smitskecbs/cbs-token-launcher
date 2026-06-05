import bannerUrl from '../assets/launcher-banner.png'
import { fetchLaunchSubmissions } from '../services/listLaunchSubmissionsService'
import { updateLaunchSubmissionStatus } from '../services/updateLaunchSubmissionStatusService'
import type { LaunchSubmissionSummary } from '../types/launchSubmission'
import { escapeHtml } from '../utils/html'
import {
  countLaunchSubmissionStatuses,
  formatLaunchSubmissionStatus,
  getLaunchSubmissionStatusClass,
  type LaunchSubmissionStatus,
} from '../utils/launchSubmissionStatus'
import { renderFooter } from '../components/sections'

const STATUS_ACTIONS: Array<{
  status: LaunchSubmissionStatus
  label: string
}> = [
  { status: 'coming_soon', label: 'Move to Coming Soon' },
  { status: 'live', label: 'Move to Live' },
  { status: 'rejected', label: 'Reject' },
]

function formatSubmissionDate(iso: string): string {
  const parsed = new Date(iso)

  if (Number.isNaN(parsed.getTime())) {
    return iso
  }

  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function renderStatusActions(submission: LaunchSubmissionSummary): string {
  const buttons = STATUS_ACTIONS.filter(
    (action) => action.status !== submission.status,
  )
    .map(
      (action) => `
        <button
          type="button"
          class="secondary-btn admin-submissions-action"
          data-admin-status-action="${action.status}"
          data-submission-id="${escapeHtml(submission.id)}"
        >
          ${escapeHtml(action.label)}
        </button>
      `,
    )
    .join('')

  return `<div class="admin-submissions-actions">${buttons}</div>`
}

function renderSubmissionRow(submission: LaunchSubmissionSummary): string {
  const statusClass = getLaunchSubmissionStatusClass(submission.status)

  return `
    <tr data-submission-row="${escapeHtml(submission.id)}">
      <td>${escapeHtml(submission.projectName)}</td>
      <td>${escapeHtml(submission.tokenSymbol)}</td>
      <td>
        <code class="admin-submissions-mint">${escapeHtml(submission.mintAddress)}</code>
      </td>
      <td>
        <span class="${statusClass}">${escapeHtml(formatLaunchSubmissionStatus(submission.status))}</span>
      </td>
      <td>${escapeHtml(formatSubmissionDate(submission.createdAt))}</td>
      <td>${renderStatusActions(submission)}</td>
    </tr>
  `
}

function renderStatusStats(counts: ReturnType<typeof countLaunchSubmissionStatuses>): string {
  return `
    <div class="admin-submissions-stats" data-admin-submissions-stats>
      <div class="admin-submissions-stat admin-submissions-stat--pending">
        <span class="admin-submissions-stat-label">Pending</span>
        <span class="admin-submissions-stat-value">${counts.pending}</span>
      </div>
      <div class="admin-submissions-stat admin-submissions-stat--coming_soon">
        <span class="admin-submissions-stat-label">Coming Soon</span>
        <span class="admin-submissions-stat-value">${counts.comingSoon}</span>
      </div>
      <div class="admin-submissions-stat admin-submissions-stat--live">
        <span class="admin-submissions-stat-label">Live</span>
        <span class="admin-submissions-stat-value">${counts.live}</span>
      </div>
      <div class="admin-submissions-stat admin-submissions-stat--rejected">
        <span class="admin-submissions-stat-label">Rejected</span>
        <span class="admin-submissions-stat-value">${counts.rejected}</span>
      </div>
    </div>
  `
}

export function renderAdminSubmissionsPage(): string {
  return `
    <main class="app-shell" id="top">
      <img
        class="site-banner"
        src="${bannerUrl}"
        alt="CBS Token Launcher"
      />

      <a class="back-link" href="/" data-router-link>← Back to launcher</a>

      <section
        class="admin-submissions-card launch-card"
        aria-labelledby="admin-submissions-title"
      >
        <h1 id="admin-submissions-title">Launch Submissions</h1>
        <p class="hero-text admin-submissions-lead">
          Review submitted launches and update their review status.
        </p>

        <div
          class="admin-submissions-stats-wrap"
          data-admin-submissions-stats-wrap
          hidden
        ></div>

        <p
          class="admin-submissions-count"
          data-admin-submissions-count
          hidden
          aria-live="polite"
        ></p>

        <p
          class="admin-submissions-state admin-submissions-state--loading"
          data-admin-submissions-loading
          aria-live="polite"
        >
          Loading submissions…
        </p>

        <p
          class="admin-submissions-state admin-submissions-state--error"
          data-admin-submissions-error
          hidden
          aria-live="polite"
        ></p>

        <p
          class="admin-submissions-state admin-submissions-state--empty"
          data-admin-submissions-empty
          hidden
          aria-live="polite"
        >
          No submissions yet.
        </p>

        <div
          class="admin-submissions-table-wrap"
          data-admin-submissions-table-wrap
          hidden
        >
          <table class="admin-submissions-table">
            <thead>
              <tr>
                <th scope="col">Project Name</th>
                <th scope="col">Token Symbol</th>
                <th scope="col">Mint Address</th>
                <th scope="col">Status</th>
                <th scope="col">Created Date</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody data-admin-submissions-body></tbody>
          </table>
        </div>
      </section>

      ${renderFooter()}
    </main>
  `
}

export function attachAdminSubmissionsPage(): void {
  const loading = document.querySelector<HTMLElement>(
    '[data-admin-submissions-loading]',
  )
  const error = document.querySelector<HTMLElement>(
    '[data-admin-submissions-error]',
  )
  const empty = document.querySelector<HTMLElement>(
    '[data-admin-submissions-empty]',
  )
  const count = document.querySelector<HTMLElement>(
    '[data-admin-submissions-count]',
  )
  const statsWrap = document.querySelector<HTMLElement>(
    '[data-admin-submissions-stats-wrap]',
  )
  const tableWrap = document.querySelector<HTMLElement>(
    '[data-admin-submissions-table-wrap]',
  )
  const body = document.querySelector<HTMLElement>(
    '[data-admin-submissions-body]',
  )

  if (
    !loading ||
    !error ||
    !empty ||
    !count ||
    !statsWrap ||
    !tableWrap ||
    !body
  ) {
    return
  }

  const ui: AdminSubmissionsElements = {
    loading,
    error,
    empty,
    count,
    statsWrap,
    tableWrap,
    body,
  }

  tableWrap.addEventListener('click', (event) => {
    void handleStatusActionClick(event, ui)
  })

  void loadSubmissions(ui)
}

interface AdminSubmissionsElements {
  loading: HTMLElement
  error: HTMLElement
  empty: HTMLElement
  count: HTMLElement
  statsWrap: HTMLElement
  tableWrap: HTMLElement
  body: HTMLElement
}

let statusUpdateInFlight = false

async function handleStatusActionClick(
  event: Event,
  ui: AdminSubmissionsElements,
): Promise<void> {
  if (statusUpdateInFlight) {
    return
  }

  const target = event.target as HTMLElement
  const button = target.closest<HTMLButtonElement>('[data-admin-status-action]')

  if (!button || button.disabled) {
    return
  }

  const submissionId = button.getAttribute('data-submission-id')
  const nextStatus = button.getAttribute(
    'data-admin-status-action',
  ) as LaunchSubmissionStatus | null

  if (!submissionId || !nextStatus) {
    return
  }

  statusUpdateInFlight = true
  ui.error.hidden = true
  ui.error.textContent = ''

  const rowButtons = ui.body.querySelectorAll<HTMLButtonElement>(
    `[data-submission-row="${submissionId}"] [data-admin-status-action]`,
  )

  for (const rowButton of rowButtons) {
    rowButton.disabled = true
  }

  try {
    const result = await updateLaunchSubmissionStatus(
      submissionId,
      nextStatus,
    )

    if (!result.ok) {
      ui.error.hidden = false
      ui.error.textContent = result.message
      return
    }

    await loadSubmissions(ui)
  } finally {
    statusUpdateInFlight = false

    for (const rowButton of rowButtons) {
      rowButton.disabled = false
    }
  }
}

async function loadSubmissions(ui: AdminSubmissionsElements): Promise<void> {
  const { loading, error, empty, count, statsWrap, tableWrap, body } = ui

  loading.hidden = false
  error.hidden = true
  empty.hidden = true
  count.hidden = true
  statsWrap.hidden = true
  tableWrap.hidden = true
  error.textContent = ''
  body.innerHTML = ''
  statsWrap.innerHTML = ''

  const result = await fetchLaunchSubmissions()

  loading.hidden = true

  if (!result.ok) {
    error.hidden = false
    error.textContent = result.message
    return
  }

  const statusCounts = countLaunchSubmissionStatuses(
    result.submissions.map((submission) => submission.status),
  )

  statsWrap.innerHTML = renderStatusStats(statusCounts)
  statsWrap.hidden = false

  count.hidden = false
  count.textContent = `${statusCounts.total} submission${statusCounts.total === 1 ? '' : 's'} total`

  if (result.count === 0) {
    empty.hidden = false
    return
  }

  body.innerHTML = result.submissions
    .map((submission) => renderSubmissionRow(submission))
    .join('')
  tableWrap.hidden = false
}
