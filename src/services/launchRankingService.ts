import type { ReadTokenMintResult } from '../solana/verifyMint'
import type { Launch, LaunchSection, LaunchVerificationLevel } from '../types/launch'
import { normalizeVerificationLevel } from '../utils/launchValidation'
import { getCachedMintVerification } from './mintVerificationCache'
import { getCachedMarketStatus } from './marketStatusCache'
import { computeLaunchAnalytics } from './launchAnalyticsService'
import { isLocallyManagedLaunch } from './submittedLaunchesStorage'

import type { HomepageSectionId } from '../types/homepage'

export type LaunchBadgeId =
  | 'live'
  | 'preparing'
  | 'upcoming'
  | 'ended'
  | 'featured'
  | 'trending'
  | 'new'
  | 'verified'
  | 'cbs-verified'
  | 'ecosystem'

export interface LaunchBadge {
  id: LaunchBadgeId
  label: string
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

export function isLaunchVerified(
  mintResult: ReadTokenMintResult | null | undefined,
): boolean {
  if (
    !mintResult?.exists ||
    mintResult.error ||
    !mintResult.metadataFound
  ) {
    return false
  }

  const website = mintResult.metadataJsonLoaded
    ? mintResult.jsonSocialLinks.website
    : mintResult.jsonExternalUrl

  return hasText(website)
}

export function getLaunchVerificationLevel(
  launch: Launch,
): LaunchVerificationLevel {
  return normalizeVerificationLevel(launch.verificationLevel)
}

export function getVerificationBadge(launch: Launch): LaunchBadge | null {
  const level = getLaunchVerificationLevel(launch)

  if (level === 'cbs-verified') {
    return { id: 'cbs-verified', label: '⭐ CBS VERIFIED' }
  }

  if (level === 'verified') {
    return { id: 'verified', label: '✓ VERIFIED' }
  }

  return null
}

export function getVerificationSortPriority(launch: Launch): number {
  const level = getLaunchVerificationLevel(launch)

  if (level === 'cbs-verified') {
    return 2
  }

  if (level === 'verified') {
    return 1
  }

  return 0
}

export function getLaunchRankScore(launch: Launch): number | null {
  const mintResult = getCachedMintVerification(launch.mintAddress)
  const marketResult = getCachedMarketStatus(launch.mintAddress)

  return computeLaunchAnalytics(mintResult, marketResult).launchScore
}

export function getLaunchBadges(
  launch: Launch,
  options: {
    homepageSection?: HomepageSectionId | null
  } = {},
): LaunchBadge[] {
  const badges: LaunchBadge[] = []
  const homepageSection = options.homepageSection ?? null

  if (
    launch.featured === true ||
    homepageSection === 'featured'
  ) {
    badges.push({ id: 'featured', label: 'Featured' })
  }

  if (homepageSection === 'trending') {
    badges.push({ id: 'trending', label: 'Trending' })
  }

  if (homepageSection === 'new') {
    badges.push({ id: 'new', label: 'New' })
  }

  const verificationBadge = getVerificationBadge(launch)

  if (verificationBadge?.id === 'verified') {
    badges.push({ id: 'verified', label: 'Verified' })
  }

  if (launch.status === 'live') {
    badges.push({ id: 'live', label: 'Live' })
  }

  if (launch.status === 'preparing') {
    badges.push({ id: 'preparing', label: 'Preparing' })
  }

  if (launch.status === 'ended') {
    badges.push({ id: 'ended', label: 'Ended' })
  }

  if (launch.section === 'upcoming') {
    badges.push({ id: 'upcoming', label: 'Upcoming' })
  }

  if (
    launch.section === 'ecosystem' &&
    homepageSection === 'ecosystem' &&
    !isLocallyManagedLaunch(launch)
  ) {
    badges.push({ id: 'ecosystem', label: 'CBS Ecosystem' })
  }

  return badges
}

function getLaunchSubmittedAt(launch: Launch): number {
  return launch.submittedAt ?? 0
}

export function sortLaunchesByRank(launches: Launch[]): Launch[] {
  return [...launches].sort((left, right) => {
    const leftVerification = getVerificationSortPriority(left)
    const rightVerification = getVerificationSortPriority(right)

    if (rightVerification !== leftVerification) {
      return rightVerification - leftVerification
    }

    const leftScore = getLaunchRankScore(left) ?? 0
    const rightScore = getLaunchRankScore(right) ?? 0

    if (rightScore !== leftScore) {
      return rightScore - leftScore
    }

    return getLaunchSubmittedAt(right) - getLaunchSubmittedAt(left)
  })
}

export function getLaunchRankInSection(
  launch: Launch,
  sectionLaunches: Launch[],
  sectionId?: HomepageSectionId | LaunchSection | null,
): number {
  const sorted =
    sectionId === 'ecosystem' || launch.section === 'ecosystem'
      ? sectionLaunches
      : sectionId === 'new'
        ? sectionLaunches
        : sortLaunchesByRank(sectionLaunches)

  const index = sorted.findIndex((entry) => entry.id === launch.id)

  return index >= 0 ? index + 1 : 0
}

export function isRankSortedSection(
  section: HomepageSectionId | LaunchSection,
): boolean {
  return (
    section === 'featured' ||
    section === 'upcoming' ||
    section === 'trending'
  )
}

export function formatLaunchRankScore(score: number | null): string {
  if (score === null) {
    return '—/100'
  }

  return `${score}/100`
}
