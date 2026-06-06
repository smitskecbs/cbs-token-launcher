import type { Launch } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import { escapeHtml } from '../utils/html'
import {
  buildMetadataStatusChecks,
  formatMetadataRefreshTimestamp,
  type MetadataStatusCheck,
} from '../utils/metadataStatusChecks'

function renderMetadataCheckItem(check: MetadataStatusCheck): string {
  if (check.state === 'pending') {
    return `
      <li class="token-detail-metadata-check token-detail-metadata-check--pending">
        <span class="token-detail-metadata-check-icon" aria-hidden="true">…</span>
        <span class="token-detail-metadata-check-label">Checking metadata…</span>
      </li>
    `
  }

  const isSuccess = check.state === 'success'
  const stateClass = isSuccess
    ? 'token-detail-metadata-check--success'
    : 'token-detail-metadata-check--missing'
  const icon = isSuccess ? '✓' : '!'
  const label = isSuccess ? check.successLabel : check.missingLabel

  return `
    <li class="token-detail-metadata-check ${stateClass}">
      <span class="token-detail-metadata-check-icon" aria-hidden="true">${icon}</span>
      <span class="token-detail-metadata-check-label">${escapeHtml(label)}</span>
    </li>
  `
}

function renderMetadataChecksList(checks: MetadataStatusCheck[]): string {
  return checks.map((check) => renderMetadataCheckItem(check)).join('')
}

export function renderTokenDetailMetadataPanel(launch: Launch): string {
  const checks = buildMetadataStatusChecks(launch, null, { loading: true })

  return `
    <section
      class="token-detail-metadata-panel"
      data-token-metadata-status-root
      aria-labelledby="token-metadata-status-heading"
    >
      <h3
        class="token-detail-heading"
        id="token-metadata-status-heading"
      >
        Metadata Status
      </h3>
      <ul
        class="token-detail-metadata-checks"
        data-token-metadata-checks
      >
        ${renderMetadataChecksList(checks)}
      </ul>
      <p
        class="token-detail-metadata-refresh"
        data-token-metadata-refresh
        hidden
      ></p>
    </section>
  `
}

export function setTokenDetailMetadataPanelLoading(launch: Launch): void {
  applyTokenDetailMetadataPanel(launch, null, { loading: true })
}

export function applyTokenDetailMetadataPanel(
  launch: Launch,
  result: ReadTokenMintResult | null,
  options: {
    loading?: boolean
    refreshedAtMs?: number | null
  } = {},
): void {
  const page = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"]`,
  )

  if (!page) {
    return
  }

  const checksRoot = page.querySelector<HTMLElement>(
    '[data-token-metadata-checks]',
  )
  const refreshElement = page.querySelector<HTMLElement>(
    '[data-token-metadata-refresh]',
  )

  if (!checksRoot) {
    return
  }

  const checks = buildMetadataStatusChecks(launch, result, {
    loading: options.loading,
  })

  checksRoot.innerHTML = renderMetadataChecksList(checks)

  if (!refreshElement) {
    return
  }

  const refreshLabel = formatMetadataRefreshTimestamp(
    options.refreshedAtMs ?? null,
  )

  if (!refreshLabel) {
    refreshElement.hidden = true
    refreshElement.textContent = ''
    return
  }

  refreshElement.hidden = false
  refreshElement.textContent = `Last metadata refresh: ${refreshLabel}`
}
