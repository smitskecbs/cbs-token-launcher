import type { Launch, OfficialLinks } from '../types/launch'
import type { HomepageLaunchSubmission } from '../types/homepageLaunch'

export function getSubmissionLaunchId(submissionId: string): string {
  return `submission-${submissionId}`
}

function buildOfficialLinks(
  submission: HomepageLaunchSubmission,
): OfficialLinks | undefined {
  const links: OfficialLinks = {}

  if (submission.website) {
    links.website = submission.website
  }

  if (submission.telegram) {
    links.telegram = submission.telegram
  }

  if (submission.x) {
    links.twitter = submission.x
  }

  return Object.keys(links).length > 0 ? links : undefined
}

export function mapSubmissionToLaunch(
  submission: HomepageLaunchSubmission,
): Launch {
  const isLive = submission.status === 'live'
  const createdAtMs = Date.parse(submission.createdAt)
  const hasCreatedAt = !Number.isNaN(createdAtMs)
  const name = submission.projectName.trim()
  const symbol = submission.tokenSymbol.trim()
  const logoSource = symbol || name || '🪙'

  return {
    id: getSubmissionLaunchId(submission.id),
    mintAddress: submission.mintAddress.trim(),
    status: isLive ? 'live' : 'preparing',
    // Live launches use a non-upcoming section so resolveHomepageSections
    // places them in New Launches (featured flag stays unset).
    section: isLive ? 'featured' : 'upcoming',
    name,
    symbol,
    description: submission.description?.trim() || undefined,
    logo: submission.logoUrl?.trim() || undefined,
    createdAt: hasCreatedAt ? createdAtMs : undefined,
    submittedAt: hasCreatedAt ? createdAtMs : undefined,
    logoFallback: logoSource.charAt(0).toUpperCase(),
    featured: submission.featured === true,
    buyUrl: submission.buyUrl?.trim() || undefined,
    verificationLevel: submission.verified ? 'verified' : undefined,
    launchInfo: {
      launchStatus: isLive ? 'Live' : 'Coming Soon',
      tradingStatus: isLive ? 'Live' : 'Trading not live yet',
      poolStatus: isLive
        ? 'Check market status'
        : 'Liquidity pool not created yet',
      launchDate: isLive ? 'Live on Solana' : 'Coming soon',
      officialLinks: buildOfficialLinks(submission),
    },
  }
}
