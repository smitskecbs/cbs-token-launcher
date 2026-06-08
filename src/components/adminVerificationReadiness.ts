import type { VerificationReadinessResult } from '../utils/verificationReadiness'
import { escapeHtml } from '../utils/html'

export function renderAdminVerificationReadinessShell(): string {
  return `
    <div
      class="admin-verification-readiness"
      data-admin-verification-readiness
      aria-label="Verification readiness"
    >
      <h3 class="admin-verification-readiness__title">Verification Readiness</h3>
      <div data-admin-verification-readiness-content>
        <p class="admin-verification-readiness__loading">Checking…</p>
      </div>
    </div>
  `
}

export function renderAdminVerificationReadiness(
  readiness: VerificationReadinessResult,
): string {
  const summaryClass = readiness.isReady
    ? 'admin-readiness-summary--ready'
    : 'admin-readiness-summary--needs'

  return `
    <details class="admin-readiness admin-verification-readiness__details" open>
      <summary class="admin-readiness-summary ${summaryClass}">
        <span class="admin-readiness-indicator">
          ${readiness.isReady ? 'Ready to verify' : 'Needs info'}
        </span>
        <span class="admin-readiness-score">
          ${readiness.passedCount} / ${readiness.totalCount} checks passed
        </span>
      </summary>
      <ul
        class="admin-readiness-checklist"
        aria-label="Verification readiness checklist"
      >
        ${readiness.checks.map((check) => renderCheckItem(check)).join('')}
      </ul>
      <p class="admin-verification-readiness__hint">
        Informational only — use the Verified toggle when manual review is complete.
      </p>
    </details>
  `
}

function renderCheckItem(
  check: VerificationReadinessResult['checks'][number],
): string {
  const stateClass = check.passed
    ? 'admin-readiness-check--pass'
    : 'admin-readiness-check--warn'
  const icon = check.passed ? '✓' : '✗'
  const label = check.passed
    ? check.label
    : check.missingLabel || check.label

  return `
    <li class="admin-readiness-check ${stateClass}">
      <span class="admin-readiness-check-icon" aria-hidden="true">${icon}</span>
      <span class="admin-readiness-check-label">${escapeHtml(label)}</span>
    </li>
  `
}

export function applyAdminVerificationReadiness(
  readiness: VerificationReadinessResult,
): void {
  const content = document.querySelector<HTMLElement>(
    '[data-admin-verification-readiness-content]',
  )

  if (!content) {
    return
  }

  content.innerHTML = renderAdminVerificationReadiness(readiness)
}
