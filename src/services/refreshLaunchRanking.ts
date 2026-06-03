import type { Launch } from '../types/launch'
import {
  getEcosystemTokens,
  getFeaturedLaunches,
  getLaunchCatalog,
  getUpcomingLaunches,
} from './launchService'
import { getCachedMintVerification } from './mintVerificationCache'
import { getCachedMarketStatus } from './marketStatusCache'
import { computeLaunchAnalytics } from './launchAnalyticsService'
import {
  applyLaunchBadges,
  applyLaunchRankDisplay,
  reorderRankedSectionCards,
  updateSectionRankLabels,
} from '../components/launchBadges'
import {
  getLaunchRankInSection,
  getLaunchRankScore,
  getVerificationSortPriority,
  isRankSortedSection,
} from './launchRankingService'

function getSectionLaunches(launch: Launch): Launch[] {
  const catalog = getLaunchCatalog()

  if (launch.section === 'featured') {
    return getFeaturedLaunches(catalog)
  }

  if (launch.section === 'upcoming') {
    return getUpcomingLaunches(catalog)
  }

  return getEcosystemTokens(catalog)
}

export function refreshLaunchRanking(launch: Launch): void {
  const mintResult = getCachedMintVerification(launch.mintAddress)
  const marketResult = getCachedMarketStatus(launch.mintAddress)
  const analytics = computeLaunchAnalytics(mintResult, marketResult)
  const score = analytics.launchScore

  applyLaunchBadges(launch.id, launch)

  const card = document.getElementById(`launch-${launch.id}`)

  if (card) {
    card.dataset.launchRankScore = String(score ?? 0)
    card.dataset.launchVerificationPriority = String(
      getVerificationSortPriority(launch),
    )
  }

  if (isRankSortedSection(launch.section)) {
    reorderRankedSectionCards(launch.section)
    return
  }

  const sectionRank = getLaunchRankInSection(
    launch,
    getSectionLaunches(launch),
  )

  applyLaunchRankDisplay(launch.id, sectionRank, score)
  updateSectionRankLabels(launch.section)
}

export function applyInitialLaunchRanking(
  launch: Launch,
  sectionRank: number,
): void {
  const score = getLaunchRankScore(launch)

  applyLaunchBadges(launch.id, launch)
  applyLaunchRankDisplay(launch.id, sectionRank, score)
}
