import bannerUrl from '../assets/launcher-banner.png'
import { loginAdmin } from '../services/adminLoginService'
import {
  clearAdminSessionToken,
  getAdminSessionToken,
  setAdminSessionToken,
} from '../services/adminSessionService'
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
        class="admin-submissions-card launch-card admin-login-card"
        data-admin-login-panel
        aria-labelledby="admin-login-title"
      >
        <h1 id="admin-login-title">Admin Login</h1>
        <p class="hero-text admin-submissions-lead">
          Enter the admin password to review launch submissions.
        </p>

        <form class="admin-login-form" data-admin-login-form novalidate>
          <label class="submit-launch-field">
            <span class="submit-launch-label">Admin Password</span>
            <input
              class="submit-launch-input"
              type="password"
              name="password"
              data-admin-login-password
              autocomplete="current-password"
              required
            />
          </label>

          <p
            class="admin-submissions-state admin-submissions-state--error"
            data-admin-login-error
            hidden
            aria-live="polite"
          ></p>

          <div class="submit-launch-actions">
            <button
              type="submit"
              class="primary-btn"
              data-admin-login-submit
            >
              Sign in
            </button>
          </div>
        </form>
      </section>

      <section
        class="admin-submissions-card launch-card"
        data-admin-dashboard-panel
        aria-labelledby="admin-submissions-title"
        hidden
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
  const loginPanel = document.querySelector<HTMLElement>(
    '[data-admin-login-panel]',
  )
  const dashboardPanel = document.querySelector<HTMLElement>(
    '[data-admin-dashboard-panel]',
  )
  const loginForm = document.querySelector<HTMLFormElement>(
    '[data-admin-login-form]',
  )
  const loginPassword = document.querySelector<HTMLInputElement>(
    '[data-admin-login-password]',
  )
  const loginSubmit = document.querySelector<HTMLButtonElement>(
    '[data-admin-login-submit]',
  )
  const loginError = document.querySelector<HTMLElement>(
    '[data-admin-login-error]',
  )
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
    !loginPanel ||
    !dashboardPanel ||
    !loginForm ||
    !loginPassword ||
    !loginSubmit ||
    !loginError ||
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

  const ui: AdminPageElements = {
    loginPanel,
    dashboardPanel,
    loginForm,
    loginPassword,
    loginSubmit,
    loginError,
    loading,
    error,
    empty,
    count,
    statsWrap,
    tableWrap,
    body,
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault()
    void handleAdminLogin(ui)
  })

  tableWrap.addEventListener('click', (event) => {
    void handleStatusActionClick(event, ui)
  })

  if (getAdminSessionToken()) {
    showDashboard(ui)
    void loadSubmissions(ui)
  } else {
    showLogin(ui)
  }
}

interface AdminPageElements {
  loginPanel: HTMLElement
  dashboardPanel: HTMLElement
  loginForm: HTMLFormElement
  loginPassword: HTMLInputElement
  loginSubmit: HTMLButtonElement
  loginError: HTMLElement
  loading: HTMLElement
  error: HTMLElement
  empty: HTMLElement
  count: HTMLElement
  statsWrap: HTMLElement
  tableWrap: HTMLElement
  body: HTMLElement
}

function showLogin(ui: AdminPageElements): void {
  ui.loginPanel.hidden = false
  ui.dashboardPanel.hidden = true
  ui.loginError.hidden = true
  ui.loginError.textContent = ''
  ui.loginSubmit.disabled = false
}

function showDashboard(ui: AdminPageElements): void {
  ui.loginPanel.hidden = true
  ui.dashboardPanel.hidden = false
}

async function handleAdminLogin(ui: AdminPageElements): Promise<void> {
  ui.loginError.hidden = true
  ui.loginError.textContent = ''
  ui.loginSubmit.disabled = true

  try {
    const result = await loginAdmin(ui.loginPassword.value)

    if (!result.ok) {
      ui.loginError.hidden = false
      ui.loginError.textContent = result.message
      return
    }

    setAdminSessionToken(result.token)
    ui.loginPassword.value = ''
    showDashboard(ui)
    await loadSubmissions(ui)
  } finally {
    ui.loginSubmit.disabled = false
  }
}

function handleUnauthorized(ui: AdminPageElements, message: string): void {
  clearAdminSessionToken()
  showLogin(ui)
  ui.loginError.hidden = false
  ui.loginError.textContent = message
}

let statusUpdateInFlight = false

async function handleStatusActionClick(
  event: Event,
  ui: AdminPageElements,
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
      if (result.unauthorized) {
        handleUnauthorized(ui, 'Your admin session expired. Please sign in again.')
        return
      }

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

async function loadSubmissions(ui: AdminPageElements): Promise<void> {
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
    if (result.unauthorized) {
      handleUnauthorized(ui, 'Admin sign-in required to view submissions.')
      return
    }

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
