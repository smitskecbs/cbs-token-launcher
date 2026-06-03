export interface HolderOverviewResult {
  mintAddress: string
  holderCount: number | null
  largestHolderPercent: number | null
  top10HoldersPercent: number | null
  top20HoldersPercent: number | null
  error: string | null
}

export const HOLDER_OVERVIEW_UNAVAILABLE = 'Data unavailable'

export const HOLDER_OVERVIEW_CHECKING = 'Checking…'
