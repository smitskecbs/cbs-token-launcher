import type { LiveReadinessResult } from '../utils/adminSubmissionLiveReadiness'
import { escapeHtml } from '../utils/html'

export function renderAdminSubmissionReadiness(
  readiness: LiveReadinessResult,
): string {
  const summaryLabel = readiness.isReady ? 'Ready for Live' : 'Needs info'
  const summaryClass = readiness.isReady
    ? 'admin-readiness-summary--ready'
    : 'admin-readiness-summary--needs'

  return `
    <details class="admin-readiness">
      <summary class="admin-readiness-summary ${summaryClass}">
        <span class="admin-readiness-indicator">
          ${escapeHtml(summaryLabel)}
        </span>
        <span class="admin-readiness-score">
          ${readiness.passedCount}/${readiness.totalCount}
        </span>
      </summary>
      <ul class="admin-readiness-checklist" aria-label="Live readiness checklist">
        ${readiness.checks
          .map((check) => renderReadinessCheckItem(check.passed, check.label))
          .join('')}
      </ul>
    </details>
  `
}

function renderReadinessCheckItem(passed: boolean, label: string): string {
  const stateClass = passed
    ? 'admin-readiness-check--pass'
    : 'admin-readiness-check--warn'
  const icon = passed ? '✓' : '!'

  return `
    <li class="admin-readiness-check ${stateClass}">
      <span class="admin-readiness-check-icon" aria-hidden="true">${icon}</span>
      <span class="admin-readiness-check-label">${escapeHtml(label)}</span>
    </li>
  `
}

export function getMoveToLiveWarningMessage(
  readiness: LiveReadinessResult,
): string {
  const missing = readiness.checks
    .filter((check) => !check.passed)
    .map((check) => check.label)

  return `This submission is not ready for Live.\n\nMissing:\n- ${missing.join('\n- ')}\n\nMove to Live anyway?`
}
