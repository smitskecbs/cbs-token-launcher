import type { Launch } from '../types/launch'
import type { LaunchSubmissionSummary } from '../types/launchSubmission'
import { getSubmissionLaunchId } from '../services/mapSubmissionToLaunch'

export function mapAdminSubmissionToLaunch(
  submission: LaunchSubmissionSummary,
): Launch {
  const createdAtMs = Date.parse(submission.createdAt)
  const hasCreatedAt = !Number.isNaN(createdAtMs)
  const name = submission.projectName.trim()
  const symbol = submission.tokenSymbol.trim()
  const logoSource = symbol || name || '🪙'
  const isLive = submission.status === 'live'
  const isComingSoon = submission.status === 'coming_soon'

  return {
    id: getSubmissionLaunchId(submission.id),
    mintAddress: submission.mintAddress.trim(),
    status: isLive ? 'live' : 'preparing',
    section: isLive ? 'featured' : 'upcoming',
    name,
    symbol,
    description: submission.description?.trim() || undefined,
    logo: submission.logoUrl?.trim() || undefined,
    createdAt: hasCreatedAt ? createdAtMs : undefined,
    submittedAt: hasCreatedAt ? createdAtMs : undefined,
    logoFallback: logoSource.charAt(0).toUpperCase(),
    launchInfo: {
      launchStatus: isLive
        ? 'Live'
        : isComingSoon
          ? 'Coming Soon'
          : 'Pending',
      tradingStatus: isLive ? 'Live' : 'Trading not live yet',
      poolStatus: isLive
        ? 'Check market status'
        : 'Liquidity pool not created yet',
      launchDate: isLive
        ? 'Live on Solana'
        : isComingSoon
          ? 'Coming soon'
          : 'Pending review',
    },
  }
}
