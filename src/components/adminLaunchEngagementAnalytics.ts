import type { LaunchEngagementMetrics } from '../types/launchEngagementMetrics'
import { escapeHtml } from '../utils/html'

export function renderAdminLaunchEngagementAnalytics(
  launchId: string,
): string {
  const id = escapeHtml(launchId)

  return `
    <div
      class="admin-launch-analytics"
      data-admin-launch-analytics="${id}"
      aria-label="Launch analytics"
    >
      <span class="admin-launch-analytics__label">Analytics</span>
      <div
        class="admin-launch-analytics__metrics"
        data-admin-launch-analytics-metrics
      >
        <span class="admin-launch-analytics__loading">Loading…</span>
      </div>
    </div>
  `
}

function formatMetricValue(value: number): string {
  return Math.max(0, value).toLocaleString('en-US')
}

export function applyAdminLaunchEngagementAnalytics(
  metrics: LaunchEngagementMetrics,
): void {
  const root = document.querySelector<HTMLElement>(
    `[data-admin-launch-analytics="${CSS.escape(metrics.launchId)}"]`,
  )
  const metricsElement = root?.querySelector<HTMLElement>(
    '[data-admin-launch-analytics-metrics]',
  )

  if (!metricsElement) {
    return
  }

  metricsElement.innerHTML = `
    <span class="admin-launch-analytics__metric">
      Views: <strong>${formatMetricValue(metrics.pageViews)}</strong>
    </span>
    <span class="admin-launch-analytics__metric">
      Votes: <strong>${formatMetricValue(metrics.votes)}</strong>
    </span>
    <span class="admin-launch-analytics__metric">
      Updates: <strong>${formatMetricValue(metrics.updates)}</strong>
    </span>
  `
}

export function setAdminLaunchEngagementAnalyticsError(launchId: string): void {
  const root = document.querySelector<HTMLElement>(
    `[data-admin-launch-analytics="${CSS.escape(launchId)}"]`,
  )
  const metricsElement = root?.querySelector<HTMLElement>(
    '[data-admin-launch-analytics-metrics]',
  )

  if (!metricsElement) {
    return
  }

  metricsElement.innerHTML =
    '<span class="admin-launch-analytics__error">Unavailable</span>'
}
