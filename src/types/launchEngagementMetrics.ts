/** Launch Analytics V1 — public engagement metrics shown in admin. */
export interface LaunchEngagementMetrics {
  launchId: string
  pageViews: number
  votes: number
  updates: number
}

/** Input for admin analytics lookups. */
export interface LaunchEngagementAnalyticsTarget {
  launchId: string
  mintAddress?: string
  submissionId?: string
}

/**
 * V2 extension point — add optional fields here later:
 * uniqueVisitors, referralSource, buttonClicks, poolClicks, etc.
 */
export type LaunchEngagementMetricsMap = Record<string, LaunchEngagementMetrics>
