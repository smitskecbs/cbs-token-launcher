import type { Launch } from '../types/launch'
import { getCachedMintVerification } from '../services/mintVerificationCache'
import { getCachedMarketStatus } from '../services/marketStatusCache'
import { computeLaunchAnalytics } from './launchAnalyticsService'
import { applyLaunchAnalytics } from '../components/launchAnalyticsPanel'
import { refreshLaunchRanking } from './refreshLaunchRanking'

export function refreshLaunchAnalytics(launch: Launch): void {
  const mintResult = getCachedMintVerification(launch.mintAddress)
  const marketResult = getCachedMarketStatus(launch.mintAddress)

  applyLaunchAnalytics(
    launch.id,
    computeLaunchAnalytics(mintResult, marketResult),
  )
  refreshLaunchRanking(launch)
}
