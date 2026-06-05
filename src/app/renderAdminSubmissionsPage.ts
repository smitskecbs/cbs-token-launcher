import bannerUrl from '../assets/launcher-banner.png'
import { fetchLaunchSubmissions } from '../services/listLaunchSubmissionsService'
import type { LaunchSubmissionSummary } from '../types/launchSubmission'
import { escapeHtml } from '../utils/html'
import { renderFooter } from '../components/sections'

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

function renderSubmissionRow(submission: LaunchSubmissionSummary): string {
  const statusClass = `admin-submissions-status admin-submissions-status--${escapeHtml(
    submission.status,
  )}`

  return `
    <tr>
      <td>${escapeHtml(submission.projectName)}</td>
      <td>${escapeHtml(submission.tokenSymbol)}</td>
      <td>
        <code class="admin-submissions-mint">${escapeHtml(submission.mintAddress)}</code>
      </td>
      <td>
        <span class="${statusClass}">${escapeHtml(submission.status)}</span>
      </td>
      <td>${escapeHtml(formatSubmissionDate(submission.createdAt))}</td>
    </tr>
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
          Read-only review list for pending and submitted launches.
        </p>

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
  const tableWrap = document.querySelector<HTMLElement>(
    '[data-admin-submissions-table-wrap]',
  )
  const body = document.querySelector<HTMLElement>(
    '[data-admin-submissions-body]',
  )

  if (!loading || !error || !empty || !count || !tableWrap || !body) {
    return
  }

  void loadSubmissions({
    loading,
    error,
    empty,
    count,
    tableWrap,
    body,
  })
}

interface AdminSubmissionsElements {
  loading: HTMLElement
  error: HTMLElement
  empty: HTMLElement
  count: HTMLElement
  tableWrap: HTMLElement
  body: HTMLElement
}

async function loadSubmissions(ui: AdminSubmissionsElements): Promise<void> {
  const { loading, error, empty, count, tableWrap, body } = ui

  loading.hidden = false
  error.hidden = true
  empty.hidden = true
  count.hidden = true
  tableWrap.hidden = true
  error.textContent = ''
  body.innerHTML = ''

  const result = await fetchLaunchSubmissions()

  loading.hidden = true

  if (!result.ok) {
    error.hidden = false
    error.textContent = result.message
    return
  }

  count.hidden = false
  count.textContent = `${result.count} submission${result.count === 1 ? '' : 's'}`

  if (result.count === 0) {
    empty.hidden = false
    return
  }

  body.innerHTML = result.submissions
    .map((submission) => renderSubmissionRow(submission))
    .join('')
  tableWrap.hidden = false
}
