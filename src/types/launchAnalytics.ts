export interface LaunchAnalyticsCheck {
  id: string
  label: string
  passed: boolean
}

export interface LaunchAnalyticsSection {
  passed: number
  total: number
  checks: LaunchAnalyticsCheck[]
}

export interface LaunchAnalytics {
  launchScore: number | null
  metadata: LaunchAnalyticsSection
  socials: LaunchAnalyticsSection
  market: LaunchAnalyticsSection
  /** True when mint verification has completed at least once */
  metadataLoaded: boolean
  /** True when market status has completed at least once */
  marketLoaded: boolean
}
