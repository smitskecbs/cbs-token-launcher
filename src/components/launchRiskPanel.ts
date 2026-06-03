import type { LaunchRiskAssessment, LaunchRiskCheck } from '../types/launchRisk'
import { escapeHtml } from '../utils/html'

const EMPTY_LEVEL = '—'

export function launchRiskPanelId(launchId: string): string {
  return `launch-risk-${launchId}`
}

export function renderLaunchRiskPanel(
  launchId: string,
  embedded = false,
): string {
  const id = escapeHtml(launchId)
  const panelClass = embedded
    ? 'launch-risk-panel launch-panel--embedded'
    : 'launch-risk-panel'
  const heading = embedded
    ? ''
    : `
      <h4
        class="launch-info-heading"
        id="launch-risk-heading-${id}"
      >
        Technical Checks
      </h4>
    `

  return `
    <section
      class="${panelClass}"
      id="${launchRiskPanelId(id)}"
      aria-labelledby="launch-risk-heading-${id}"
    >
      ${heading}
      <div
        class="launch-risk-checks"
        data-launch-risk-positive-checks
      ></div>
      <div
        class="launch-risk-checks launch-risk-checks--warnings"
        data-launch-risk-warning-checks
      ></div>
      <dl class="launch-risk-details">
        <div class="launch-risk-row">
          <dt>Technical Risk</dt>
          <dd
            class="launch-risk-level"
            data-launch-risk-level
          >${EMPTY_LEVEL}</dd>
        </div>
      </dl>
    </section>
  `
}

export function applyLaunchRisk(
  launchId: string,
  assessment: LaunchRiskAssessment,
): void {
  applyLaunchRiskToRoot(
    document.getElementById(launchRiskPanelId(launchId)),
    assessment,
  )

  applyLaunchRiskToRoot(
    document.querySelector<HTMLElement>(
      `[data-token-detail="${launchId}"] [data-launch-risk-root]`,
    ),
    assessment,
  )

  applyLaunchOverviewRisk(launchId, assessment)
}

function applyLaunchRiskToRoot(
  root: HTMLElement | null,
  assessment: LaunchRiskAssessment,
): void {
  if (!root) {
    return
  }

  renderRiskChecks(
    root,
    '[data-launch-risk-positive-checks]',
    assessment.positiveChecks,
    assessment.loaded,
    'positive',
  )
  renderRiskChecks(
    root,
    '[data-launch-risk-warning-checks]',
    assessment.warningChecks,
    assessment.loaded,
    'warning',
  )

  const levelElement = root.querySelector<HTMLElement>(
    '[data-launch-risk-level]',
  )

  if (!levelElement) {
    return
  }

  levelElement.textContent = assessment.loaded
    ? assessment.riskLevel ?? EMPTY_LEVEL
    : EMPTY_LEVEL
  levelElement.className = `launch-risk-level launch-risk-level--${(
    assessment.riskLevel ?? 'unknown'
  ).toLowerCase()}`
}

function renderRiskChecks(
  root: HTMLElement,
  selector: string,
  checks: LaunchRiskCheck[],
  loaded: boolean,
  kind: 'positive' | 'warning',
): void {
  const container = root.querySelector<HTMLElement>(selector)

  if (!container) {
    return
  }

  if (!loaded || checks.length === 0) {
    container.innerHTML = ''
    return
  }

  container.innerHTML = checks
    .map((check) => renderRiskCheckLine(check, kind))
    .join('')
}

function renderRiskCheckLine(
  check: LaunchRiskCheck,
  kind: 'positive' | 'warning',
): string {
  if (kind === 'positive') {
    const stateClass = check.triggered
      ? 'launch-risk-check is-pass'
      : 'launch-risk-check is-fail'

    return `
      <span class="${stateClass}">
        ${check.triggered ? '✓' : '○'} ${escapeHtml(check.label)}
      </span>
    `
  }

  if (!check.triggered) {
    return `
      <span class="launch-risk-check is-clear">
        ✓ ${escapeHtml(check.label.replace(' active', ''))} revoked
      </span>
    `
  }

  return `
    <span class="launch-risk-check is-warning">
      ⚠ ${escapeHtml(check.label)}
    </span>
  `
}

function applyLaunchOverviewRisk(
  launchId: string,
  assessment: LaunchRiskAssessment,
): void {
  const element = document.querySelector<HTMLElement>(
    `[data-token-card="${launchId}"] [data-launch-overview-risk]`,
  )

  if (!element) {
    return
  }

  element.textContent = assessment.loaded
    ? assessment.riskLevel ?? EMPTY_LEVEL
    : EMPTY_LEVEL
  element.className = `launch-risk-level launch-risk-level--${(
    assessment.riskLevel ?? 'unknown'
  ).toLowerCase()}`
}
