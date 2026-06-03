import type {
  LaunchAnalytics,
  LaunchAnalyticsSection,
} from '../types/launchAnalytics'
import { escapeHtml } from '../utils/html'

const EMPTY_SCORE = '—'

export function launchAnalyticsPanelId(launchId: string): string {
  return `launch-analytics-${launchId}`
}

export function renderLaunchAnalyticsPanel(
  launchId: string,
  embedded = false,
): string {
  const id = escapeHtml(launchId)
  const panelClass = embedded
    ? 'launch-analytics-panel launch-panel--embedded'
    : 'launch-analytics-panel'
  const heading = embedded
    ? ''
    : `
      <h4
        class="launch-info-heading"
        id="launch-analytics-heading-${id}"
      >
        Launch Analytics
      </h4>
    `

  return `
    <section
      class="${panelClass}"
      id="${launchAnalyticsPanelId(id)}"
      aria-labelledby="launch-analytics-heading-${id}"
    >
      ${heading}
      <dl class="launch-analytics-details">
        <div class="launch-analytics-row launch-analytics-row--score">
          <dt>Launch Score</dt>
          <dd data-launch-analytics-score>${EMPTY_SCORE}/100</dd>
        </div>
        <div class="launch-analytics-row">
          <dt>Metadata</dt>
          <dd data-launch-analytics-metadata>${EMPTY_SCORE}/4</dd>
        </div>
        <div
          class="launch-analytics-checks"
          data-launch-analytics-metadata-checks
        ></div>
        <div class="launch-analytics-row">
          <dt>Socials</dt>
          <dd data-launch-analytics-socials>${EMPTY_SCORE}/3</dd>
        </div>
        <div
          class="launch-analytics-checks"
          data-launch-analytics-social-checks
        ></div>
        <div class="launch-analytics-row">
          <dt>Market</dt>
          <dd data-launch-analytics-market>${EMPTY_SCORE}/2</dd>
        </div>
        <div
          class="launch-analytics-checks"
          data-launch-analytics-market-checks
        ></div>
      </dl>
    </section>
  `
}

export function applyLaunchAnalytics(
  launchId: string,
  analytics: LaunchAnalytics,
): void {
  applyLaunchAnalyticsToRoot(
    document.getElementById(launchAnalyticsPanelId(launchId)),
    analytics,
  )

  applyLaunchAnalyticsToRoot(
    document.querySelector<HTMLElement>(
      `[data-token-detail="${launchId}"] [data-launch-analytics-root]`,
    ),
    analytics,
  )

  applyLaunchOverviewScore(launchId, analytics)
}

export function setLaunchAnalyticsChecking(launchId: string): void {
  const checking: LaunchAnalytics = {
    launchScore: null,
    metadata: { passed: 0, total: 4, checks: [] },
    socials: { passed: 0, total: 3, checks: [] },
    market: { passed: 0, total: 2, checks: [] },
    metadataLoaded: false,
    marketLoaded: false,
  }

  applyLaunchAnalytics(launchId, checking)

  for (const root of getAnalyticsRoots(launchId)) {
    setScoreText(root, '[data-launch-analytics-score]', 'Checking…')
    setScoreText(root, '[data-launch-analytics-metadata]', '…/4')
    setScoreText(root, '[data-launch-analytics-socials]', '…/3')
    setScoreText(root, '[data-launch-analytics-market]', '…/2')
  }
}

function getAnalyticsRoots(launchId: string): HTMLElement[] {
  return [
    document.getElementById(launchAnalyticsPanelId(launchId)),
    document.querySelector<HTMLElement>(
      `[data-token-detail="${launchId}"] [data-launch-analytics-root]`,
    ),
  ].filter((root): root is HTMLElement => root !== null)
}

function applyLaunchAnalyticsToRoot(
  root: HTMLElement | null,
  analytics: LaunchAnalytics,
): void {
  if (!root) {
    return
  }

  setScoreText(
    root,
    '[data-launch-analytics-score]',
    formatLaunchScore(analytics.launchScore),
  )
  setScoreText(
    root,
    '[data-launch-analytics-metadata]',
    formatSectionScore(analytics.metadata, analytics.metadataLoaded),
  )
  setScoreText(
    root,
    '[data-launch-analytics-socials]',
    formatSectionScore(analytics.socials, analytics.metadataLoaded),
  )
  setScoreText(
    root,
    '[data-launch-analytics-market]',
    formatSectionScore(analytics.market, analytics.marketLoaded),
  )

  renderChecks(
    root,
    '[data-launch-analytics-metadata-checks]',
    analytics.metadata,
    analytics.metadataLoaded,
  )
  renderChecks(
    root,
    '[data-launch-analytics-social-checks]',
    analytics.socials,
    analytics.metadataLoaded,
  )
  renderChecks(
    root,
    '[data-launch-analytics-market-checks]',
    analytics.market,
    analytics.marketLoaded,
  )
}

function formatLaunchScore(score: number | null): string {
  if (score === null) {
    return `${EMPTY_SCORE}/100`
  }

  return `${score}/100`
}

function formatSectionScore(
  section: LaunchAnalyticsSection,
  loaded: boolean,
): string {
  if (!loaded) {
    return `${EMPTY_SCORE}/${section.total}`
  }

  return `${section.passed}/${section.total}`
}

function renderChecks(
  root: HTMLElement,
  selector: string,
  section: LaunchAnalyticsSection,
  loaded: boolean,
): void {
  const container = root.querySelector<HTMLElement>(selector)

  if (!container) {
    return
  }

  if (!loaded || section.checks.length === 0) {
    container.innerHTML = ''
    return
  }

  container.innerHTML = section.checks
    .map((check) => {
      const stateClass = check.passed
        ? 'launch-analytics-check is-pass'
        : 'launch-analytics-check is-fail'

      return `
        <span class="${stateClass}">
          ${check.passed ? '✓' : '○'} ${escapeHtml(check.label)}
        </span>
      `
    })
    .join('')
}

function setScoreText(
  root: HTMLElement | null,
  selector: string,
  value: string,
): void {
  const element = root?.querySelector<HTMLElement>(selector)

  if (element) {
    element.textContent = value
  }
}

function applyLaunchOverviewScore(
  launchId: string,
  analytics: LaunchAnalytics,
): void {
  const element = document.querySelector<HTMLElement>(
    `[data-token-card="${launchId}"] [data-launch-overview-score]`,
  )

  if (element) {
    element.textContent = formatLaunchScore(analytics.launchScore)
  }
}
