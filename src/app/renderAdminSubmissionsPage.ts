import bannerUrl from '../assets/launcher-banner.png'
import {
  attachAdminEditSubmissionModal,
  renderAdminEditSubmissionModal,
} from '../components/adminEditSubmissionModal'
import { loginAdmin } from '../services/adminLoginService'
import {
  clearAdminSessionToken,
  getAdminSessionToken,
  setAdminSessionToken,
} from '../services/adminSessionService'
import { fetchLaunchSubmissions } from '../services/listLaunchSubmissionsService'
import { updateLaunchSubmissionStatus } from '../services/updateLaunchSubmissionStatusService'
import { updateLaunchSubmissionFeatured } from '../services/updateLaunchSubmissionFeaturedService'
import { deleteLaunchSubmission } from '../services/deleteLaunchSubmissionService'
import { updateLaunchSubmissionVerified } from '../services/updateLaunchSubmissionVerifiedService'
import type { LaunchSubmissionSummary } from '../types/launchSubmission'
import {
  renderAdminSubmissionReadiness,
  getMoveToLiveWarningMessage,
} from '../components/adminSubmissionReadiness'
import {
  DUPLICATE_MINT_WARNING_MESSAGE,
  getSubmissionIdsWithMintWarning,
} from '../utils/adminSubmissionMintWarnings'
import { evaluateLiveReadiness } from '../utils/adminSubmissionLiveReadiness'
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

function renderFeaturedToggle(submission: LaunchSubmissionSummary): string {
  const isFeatured = submission.featured === true
  const activeClass = isFeatured
    ? ' admin-submissions-featured-toggle--on'
    : ''

  return `
    <button
      type="button"
      class="secondary-btn admin-submissions-action admin-submissions-featured-toggle${activeClass}"
      data-admin-featured-toggle
      data-submission-id="${escapeHtml(submission.id)}"
      data-featured="${isFeatured ? 'true' : 'false'}"
      aria-pressed="${isFeatured ? 'true' : 'false'}"
    >
      ${isFeatured ? 'Featured: On' : 'Featured: Off'}
    </button>
  `
}

function renderVerifiedToggle(submission: LaunchSubmissionSummary): string {
  const isVerified = submission.verified === true
  const activeClass = isVerified
    ? ' admin-submissions-verified-toggle--on'
    : ''

  return `
    <button
      type="button"
      class="secondary-btn admin-submissions-action admin-submissions-verified-toggle${activeClass}"
      data-admin-verified-toggle
      data-submission-id="${escapeHtml(submission.id)}"
      data-verified="${isVerified ? 'true' : 'false'}"
      aria-pressed="${isVerified ? 'true' : 'false'}"
    >
      ${isVerified ? 'Verified: On' : 'Verified: Off'}
    </button>
  `
}

function renderStatusActions(
  submission: LaunchSubmissionSummary,
  readiness: ReturnType<typeof evaluateLiveReadiness>,
): string {
  const featuredToggle = renderFeaturedToggle(submission)
  const verifiedToggle = renderVerifiedToggle(submission)
  const editButton = `
    <button
      type="button"
      class="secondary-btn admin-submissions-action"
      data-admin-edit-submission
      data-submission-id="${escapeHtml(submission.id)}"
    >
      Edit
    </button>
  `

  const statusButtons = STATUS_ACTIONS.filter(
    (action) => action.status !== submission.status,
  )
    .map((action) => {
      const isMoveToLive = action.status === 'live'
      const notReadyAttr =
        isMoveToLive && !readiness.isReady ? ' data-not-ready-for-live="true"' : ''
      const notReadyTitle =
        isMoveToLive && !readiness.isReady
          ? ' title="Not ready for Live — review readiness checklist"'
          : ''

      return `
        <button
          type="button"
          class="secondary-btn admin-submissions-action${isMoveToLive && !readiness.isReady ? ' admin-submissions-action--warn' : ''}"
          data-admin-status-action="${action.status}"
          data-submission-id="${escapeHtml(submission.id)}"
          ${notReadyAttr}${notReadyTitle}
        >
          ${escapeHtml(action.label)}
        </button>
      `
    })
    .join('')

  const isRejected = submission.status === 'rejected'
  const deleteButtonClass = isRejected
    ? ' admin-submissions-action--delete-highlight'
    : ''

  const deleteButton = `
    <button
      type="button"
      class="admin-submissions-action admin-submissions-action--delete${deleteButtonClass}"
      data-admin-delete-submission
      data-submission-id="${escapeHtml(submission.id)}"
    >
      Delete
    </button>
  `

  return `<div class="admin-submissions-actions">${featuredToggle}${verifiedToggle}${editButton}${statusButtons}${deleteButton}</div>`
}

function renderSubmissionRow(
  submission: LaunchSubmissionSummary,
  showMintWarning: boolean,
): string {
  const readiness = evaluateLiveReadiness(submission, {
    hasMintWarning: showMintWarning,
  })
  const statusClass = getLaunchSubmissionStatusClass(submission.status)
  const mintWarning = showMintWarning
    ? `
        <p class="admin-submissions-mint-warning">
          ${escapeHtml(DUPLICATE_MINT_WARNING_MESSAGE)}
        </p>
      `
    : ''

  return `
    <tr data-submission-row="${escapeHtml(submission.id)}">
      <td>${escapeHtml(submission.projectName)}</td>
      <td>${escapeHtml(submission.tokenSymbol)}</td>
      <td class="admin-submissions-mint-cell">
        <code class="admin-submissions-mint">${escapeHtml(submission.mintAddress)}</code>
        ${mintWarning}
      </td>
      <td>
        <span class="${statusClass}">${escapeHtml(formatLaunchSubmissionStatus(submission.status))}</span>
      </td>
      <td class="admin-submissions-interest-cell">
        <span class="admin-submissions-interest-count">${submission.interestCount}</span>
      </td>
      <td class="admin-submissions-readiness-cell">
        ${renderAdminSubmissionReadiness(readiness)}
      </td>
      <td>${escapeHtml(formatSubmissionDate(submission.createdAt))}</td>
      <td>${renderStatusActions(submission, readiness)}</td>
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

function renderAdminDeleteConfirmDialog(): string {
  return `
    <dialog
      class="admin-delete-dialog"
      data-admin-delete-dialog
      aria-labelledby="admin-delete-dialog-title"
    >
      <form method="dialog" class="admin-delete-dialog-panel">
        <h2 class="admin-delete-dialog-title" id="admin-delete-dialog-title">
          Delete submission permanently?
        </h2>
        <p class="admin-delete-dialog-copy">
          Project:
          <strong data-admin-delete-project-name></strong>
        </p>
        <p class="admin-delete-dialog-copy">
          This action cannot be undone.
        </p>
        <div class="admin-delete-dialog-actions">
          <button
            type="button"
            class="secondary-btn"
            data-admin-delete-cancel
          >
            Cancel
          </button>
          <button
            type="button"
            class="admin-submissions-action admin-submissions-action--delete"
            data-admin-delete-confirm
          >
            Delete
          </button>
        </div>
      </form>
    </dialog>
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
                <th scope="col">Interest</th>
                <th scope="col">Readiness</th>
                <th scope="col">Created Date</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody data-admin-submissions-body></tbody>
          </table>
        </div>
      </section>

      ${renderAdminEditSubmissionModal()}
      ${renderAdminDeleteConfirmDialog()}
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

  let loadedSubmissions: LaunchSubmissionSummary[] = []

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault()
    void handleAdminLogin(ui, loadedSubmissions)
  })

  const { openEditSubmissionModal } = attachAdminEditSubmissionModal({
    onSaved: async () => {
      await loadSubmissions(ui, loadedSubmissions)
    },
    onUnauthorized: (message) => {
      handleUnauthorized(ui, message)
    },
  })

  const deleteDialog = document.querySelector<HTMLDialogElement>(
    '[data-admin-delete-dialog]',
  )
  const deleteProjectName = document.querySelector<HTMLElement>(
    '[data-admin-delete-project-name]',
  )
  const deleteCancelButton = document.querySelector<HTMLButtonElement>(
    '[data-admin-delete-cancel]',
  )
  const deleteConfirmButton = document.querySelector<HTMLButtonElement>(
    '[data-admin-delete-confirm]',
  )

  let pendingDeleteSubmissionId: string | null = null

  deleteCancelButton?.addEventListener('click', () => {
    pendingDeleteSubmissionId = null
    deleteDialog?.close()
  })

  deleteDialog?.addEventListener('cancel', () => {
    pendingDeleteSubmissionId = null
  })

  deleteConfirmButton?.addEventListener('click', () => {
    void handleDeleteSubmissionConfirm(
      ui,
      loadedSubmissions,
      deleteDialog,
      () => pendingDeleteSubmissionId,
      () => {
        pendingDeleteSubmissionId = null
      },
    )
  })

  tableWrap.addEventListener('click', (event) => {
    void handleTableActionClick(
      event,
      ui,
      loadedSubmissions,
      openEditSubmissionModal,
      (submission) => {
        pendingDeleteSubmissionId = submission.id

        if (deleteProjectName) {
          deleteProjectName.textContent = submission.projectName
        }

        deleteDialog?.showModal()
      },
    )
  })

  if (getAdminSessionToken()) {
    showDashboard(ui)
    void loadSubmissions(ui, loadedSubmissions)
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

async function handleAdminLogin(
  ui: AdminPageElements,
  loadedSubmissions: LaunchSubmissionSummary[],
): Promise<void> {
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
    await loadSubmissions(ui, loadedSubmissions)
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
let featuredUpdateInFlight = false
let verifiedUpdateInFlight = false
let deleteUpdateInFlight = false

function refreshAdminDashboardCounts(
  ui: AdminPageElements,
  loadedSubmissions: LaunchSubmissionSummary[],
): void {
  const statusCounts = countLaunchSubmissionStatuses(
    loadedSubmissions.map((submission) => submission.status),
  )

  ui.statsWrap.innerHTML = renderStatusStats(statusCounts)
  ui.statsWrap.hidden = false
  ui.count.hidden = false
  ui.count.textContent = `${statusCounts.total} submission${statusCounts.total === 1 ? '' : 's'} total`

  if (loadedSubmissions.length === 0) {
    ui.tableWrap.hidden = true
    ui.empty.hidden = false
    return
  }

  ui.empty.hidden = true
  ui.tableWrap.hidden = false
}

async function handleDeleteSubmissionConfirm(
  ui: AdminPageElements,
  loadedSubmissions: LaunchSubmissionSummary[],
  deleteDialog: HTMLDialogElement | null,
  getPendingDeleteId: () => string | null,
  clearPendingDelete: () => void,
): Promise<void> {
  if (deleteUpdateInFlight) {
    return
  }

  const submissionId = getPendingDeleteId()

  if (!submissionId) {
    return
  }

  deleteUpdateInFlight = true
  ui.error.hidden = true
  ui.error.textContent = ''

  const confirmButton = document.querySelector<HTMLButtonElement>(
    '[data-admin-delete-confirm]',
  )
  const cancelButton = document.querySelector<HTMLButtonElement>(
    '[data-admin-delete-cancel]',
  )

  if (confirmButton) {
    confirmButton.disabled = true
  }

  if (cancelButton) {
    cancelButton.disabled = true
  }

  try {
    const result = await deleteLaunchSubmission(submissionId)

    if (!result.ok) {
      if (result.unauthorized) {
        deleteDialog?.close()
        clearPendingDelete()
        handleUnauthorized(ui, 'Your admin session expired. Please sign in again.')
        return
      }

      ui.error.hidden = false
      ui.error.textContent = result.message
      return
    }

    const index = loadedSubmissions.findIndex((item) => item.id === submissionId)

    if (index >= 0) {
      loadedSubmissions.splice(index, 1)
    }

    ui.body
      .querySelector(`[data-submission-row="${submissionId}"]`)
      ?.remove()

    refreshAdminDashboardCounts(ui, loadedSubmissions)
    deleteDialog?.close()
    clearPendingDelete()
  } finally {
    deleteUpdateInFlight = false

    if (confirmButton) {
      confirmButton.disabled = false
    }

    if (cancelButton) {
      cancelButton.disabled = false
    }
  }
}

async function handleTableActionClick(
  event: Event,
  ui: AdminPageElements,
  loadedSubmissions: LaunchSubmissionSummary[],
  openEditSubmissionModal: (submission: LaunchSubmissionSummary) => void,
  openDeleteDialog: (submission: LaunchSubmissionSummary) => void,
): Promise<void> {
  const target = event.target as HTMLElement
  const deleteButton = target.closest<HTMLButtonElement>(
    '[data-admin-delete-submission]',
  )

  if (deleteButton && !deleteButton.disabled) {
    const submissionId = deleteButton.getAttribute('data-submission-id')
    const submission = loadedSubmissions.find((item) => item.id === submissionId)

    if (submission) {
      openDeleteDialog(submission)
    }

    return
  }

  const editButton = target.closest<HTMLButtonElement>(
    '[data-admin-edit-submission]',
  )

  if (editButton && !editButton.disabled) {
    const submissionId = editButton.getAttribute('data-submission-id')
    const submission = loadedSubmissions.find((item) => item.id === submissionId)

    if (submission) {
      openEditSubmissionModal(submission)
    }

    return
  }

  const featuredButton = target.closest<HTMLButtonElement>(
    '[data-admin-featured-toggle]',
  )

  if (featuredButton && !featuredButton.disabled) {
    await handleFeaturedToggleClick(event, ui, loadedSubmissions)
    return
  }

  const verifiedButton = target.closest<HTMLButtonElement>(
    '[data-admin-verified-toggle]',
  )

  if (verifiedButton && !verifiedButton.disabled) {
    await handleVerifiedToggleClick(event, ui, loadedSubmissions)
    return
  }

  await handleStatusActionClick(event, ui, loadedSubmissions)
}

function applyFeaturedToggleState(
  button: HTMLButtonElement,
  featured: boolean,
): void {
  button.setAttribute('data-featured', featured ? 'true' : 'false')
  button.setAttribute('aria-pressed', featured ? 'true' : 'false')
  button.textContent = featured ? 'Featured: On' : 'Featured: Off'
  button.classList.toggle('admin-submissions-featured-toggle--on', featured)
}

async function handleFeaturedToggleClick(
  event: Event,
  ui: AdminPageElements,
  loadedSubmissions: LaunchSubmissionSummary[],
): Promise<void> {
  if (featuredUpdateInFlight) {
    return
  }

  const target = event.target as HTMLElement
  const button = target.closest<HTMLButtonElement>('[data-admin-featured-toggle]')

  if (!button || button.disabled) {
    return
  }

  const submissionId = button.getAttribute('data-submission-id')

  if (!submissionId) {
    return
  }

  const currentFeatured = button.getAttribute('data-featured') === 'true'
  const nextFeatured = !currentFeatured

  featuredUpdateInFlight = true
  ui.error.hidden = true
  ui.error.textContent = ''

  const rowButtons = ui.body.querySelectorAll<HTMLButtonElement>(
    `[data-submission-row="${submissionId}"] button`,
  )

  for (const rowButton of rowButtons) {
    rowButton.disabled = true
  }

  try {
    const result = await updateLaunchSubmissionFeatured(
      submissionId,
      nextFeatured,
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

    const submission = loadedSubmissions.find((item) => item.id === submissionId)

    if (submission) {
      submission.featured = result.featured
    }

    const featuredButtons = ui.body.querySelectorAll<HTMLButtonElement>(
      `[data-submission-row="${submissionId}"] [data-admin-featured-toggle]`,
    )

    for (const featuredButton of featuredButtons) {
      applyFeaturedToggleState(featuredButton, result.featured)
    }
  } finally {
    featuredUpdateInFlight = false

    for (const rowButton of rowButtons) {
      rowButton.disabled = false
    }
  }
}

async function handleVerifiedToggleClick(
  event: Event,
  ui: AdminPageElements,
  loadedSubmissions: LaunchSubmissionSummary[],
): Promise<void> {
  if (verifiedUpdateInFlight) {
    return
  }

  const target = event.target as HTMLElement
  const button = target.closest<HTMLButtonElement>('[data-admin-verified-toggle]')

  if (!button || button.disabled) {
    return
  }

  const submissionId = button.getAttribute('data-submission-id')

  if (!submissionId) {
    return
  }

  const currentVerified = button.getAttribute('data-verified') === 'true'
  const nextVerified = !currentVerified

  verifiedUpdateInFlight = true
  ui.error.hidden = true
  ui.error.textContent = ''

  const rowButtons = ui.body.querySelectorAll<HTMLButtonElement>(
    `[data-submission-row="${submissionId}"] button`,
  )

  for (const rowButton of rowButtons) {
    rowButton.disabled = true
  }

  try {
    const result = await updateLaunchSubmissionVerified(
      submissionId,
      nextVerified,
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

    await loadSubmissions(ui, loadedSubmissions)
  } finally {
    verifiedUpdateInFlight = false

    for (const rowButton of rowButtons) {
      rowButton.disabled = false
    }
  }
}

async function handleStatusActionClick(
  event: Event,
  ui: AdminPageElements,
  loadedSubmissions: LaunchSubmissionSummary[],
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

  if (nextStatus === 'live') {
    const submission = loadedSubmissions.find((item) => item.id === submissionId)

    if (submission) {
      const mintWarningIds = getSubmissionIdsWithMintWarning(loadedSubmissions)
      const readiness = evaluateLiveReadiness(submission, {
        hasMintWarning: mintWarningIds.has(submissionId),
      })

      if (!readiness.isReady) {
        const proceed = window.confirm(getMoveToLiveWarningMessage(readiness))

        if (!proceed) {
          return
        }
      }
    }
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

    await loadSubmissions(ui, loadedSubmissions)
  } finally {
    statusUpdateInFlight = false

    for (const rowButton of rowButtons) {
      rowButton.disabled = false
    }
  }
}

async function loadSubmissions(
  ui: AdminPageElements,
  loadedSubmissions: LaunchSubmissionSummary[],
): Promise<void> {
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

  loadedSubmissions.length = 0
  loadedSubmissions.push(...result.submissions)

  if (result.count === 0) {
    refreshAdminDashboardCounts(ui, loadedSubmissions)
    return
  }

  const mintWarningIds = getSubmissionIdsWithMintWarning(result.submissions)

  body.innerHTML = result.submissions
    .map((submission) =>
      renderSubmissionRow(
        submission,
        mintWarningIds.has(submission.id),
      ),
    )
    .join('')

  refreshAdminDashboardCounts(ui, loadedSubmissions)
}
