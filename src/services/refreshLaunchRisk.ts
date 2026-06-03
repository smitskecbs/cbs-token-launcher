import type { Launch } from '../types/launch'
import { getCachedMintVerification } from '../services/mintVerificationCache'
import { getCachedMarketStatus } from '../services/marketStatusCache'
import { computeLaunchRisk } from './launchRiskService'
import { applyLaunchRisk } from '../components/launchRiskPanel'

export function refreshLaunchRisk(launch: Launch): void {
  const mintResult = getCachedMintVerification(launch.mintAddress)
  const marketResult = getCachedMarketStatus(launch.mintAddress)

  applyLaunchRisk(
    launch.id,
    computeLaunchRisk(mintResult, marketResult),
  )
}
