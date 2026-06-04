import type { Launch } from '../types/launch'
import {
  getEcosystemTokens,
  getFeaturedLaunches,
  getHomepageSectionLaunches,
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
import type { HomepageSectionId } from '../types/homepage'
import { getLaunchHomepageSection, resolveHomepageSections } from './homepageSectionsService'

function getSectionLaunches(launch: Launch): Launch[] {
  return getHomepageSectionLaunches(launch)
}

function getHomepageSectionId(launch: Launch): HomepageSectionId | null {
  const resolved = resolveHomepageSections(getLaunchCatalog())
  return getLaunchHomepageSection(launch, resolved)
}

export function refreshLaunchRanking(launch: Launch): void {
  const mintResult = getCachedMintVerification(launch.mintAddress)
  const marketResult = getCachedMarketStatus(launch.mintAddress)
  const analytics = computeLaunchAnalytics(mintResult, marketResult)
  const score = analytics.launchScore
  const homepageSection = getHomepageSectionId(launch)

  applyLaunchBadges(launch.id, launch)

  const card = document.getElementById(`launch-${launch.id}`)

  if (card) {
    card.dataset.launchRankScore = String(score ?? 0)
    card.dataset.launchVerificationPriority = String(
      getVerificationSortPriority(launch),
    )
  }

  if (homepageSection && isRankSortedSection(homepageSection)) {
    reorderRankedSectionCards(homepageSection)
    return
  }

  const sectionRank = getLaunchRankInSection(
    launch,
    getSectionLaunches(launch),
    homepageSection,
  )

  applyLaunchRankDisplay(launch.id, sectionRank, score)

  if (homepageSection) {
    updateSectionRankLabels(homepageSection)
  }
}

export function applyInitialLaunchRanking(
  launch: Launch,
  sectionRank: number,
): void {
  const score = getLaunchRankScore(launch)

  applyLaunchBadges(launch.id, launch)
  applyLaunchRankDisplay(launch.id, sectionRank, score)
}

/** @deprecated Use getHomepageSectionLaunches */
export function getLegacySectionLaunches(launch: Launch): Launch[] {
  const catalog = getLaunchCatalog()

  if (launch.section === 'featured') {
    return getFeaturedLaunches(catalog)
  }

  if (launch.section === 'upcoming') {
    return getUpcomingLaunches(catalog)
  }

  return getEcosystemTokens(catalog)
}
