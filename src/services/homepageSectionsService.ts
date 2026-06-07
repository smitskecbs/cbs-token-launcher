import type { Launch } from '../types/launch'
import type { HomepageSectionId } from '../types/homepage'
import { getDiscoveryCardStatusLabel } from '../utils/launchDetailDisplay'
import {
  getVerificationSortPriority,
  sortLaunchesByRank,
} from './launchRankingService'

export type { HomepageSectionId } from '../types/homepage'

export interface ResolvedHomepageSections {
  featured: Launch[]
  listed: Launch[]
  trending: Launch[]
  newLaunches: Launch[]
  upcoming: Launch[]
  ecosystem: Launch[]
  /** Which homepage section each launch is displayed in */
  launchSectionById: Map<string, HomepageSectionId>
}

/** Read creation time for sorting New Launches */
export function getLaunchCreatedAt(launch: Launch): number {
  return launch.submittedAt ?? launch.createdAt ?? 0
}

export function isFeaturedLaunch(launch: Launch): boolean {
  return launch.featured === true
}

/** Approved public listings that are Coming Soon or Live (not Preparing/Ended). */
export function isListedPublicLaunch(launch: Launch): boolean {
  const statusLabel = getDiscoveryCardStatusLabel(launch)

  return statusLabel === 'Coming Soon' || statusLabel === 'Live'
}

const DEFAULT_FEATURED_FALLBACK_IDS = new Set(['cbs-coin', 'mango'])

function resolveFeaturedLaunches(catalog: Launch[]): Launch[] {
  const featured = sortLaunchesByRank(
    catalog.filter((launch) => isFeaturedLaunch(launch)),
  )

  if (featured.length > 0) {
    return featured
  }

  return sortLaunchesByRank(
    catalog.filter((launch) => DEFAULT_FEATURED_FALLBACK_IDS.has(launch.id)),
  )
}

function sortLaunchesByInterest(launches: Launch[]): Launch[] {
  return [...launches].sort(
    (left, right) =>
      (right.interestCount ?? 0) - (left.interestCount ?? 0),
  )
}

function sortLaunchesByCreatedAt(launches: Launch[]): Launch[] {
  return [...launches].sort(
    (left, right) =>
      getLaunchCreatedAt(right) - getLaunchCreatedAt(left),
  )
}

/**
 * Assign each launch to a single homepage section.
 * Priority: Featured > Listed > Trending > New > Upcoming > Ecosystem
 */
export function resolveHomepageSections(
  catalog: Launch[],
): ResolvedHomepageSections {
  const assigned = new Set<string>()
  const launchSectionById = new Map<string, HomepageSectionId>()

  const featured = resolveFeaturedLaunches(catalog)

  for (const launch of featured) {
    assigned.add(launch.id)
    launchSectionById.set(launch.id, 'featured')
  }

  const listed = sortLaunchesByRank(
    catalog.filter(
      (launch) =>
        !assigned.has(launch.id) &&
        !isFeaturedLaunch(launch) &&
        isListedPublicLaunch(launch),
    ),
  )

  for (const launch of listed) {
    assigned.add(launch.id)
    launchSectionById.set(launch.id, 'listed')
  }

  const trending = getTrendingLaunchCandidates(catalog)

  for (const launch of trending) {
    if (assigned.has(launch.id)) {
      continue
    }

    assigned.add(launch.id)
    launchSectionById.set(launch.id, 'trending')
  }

  const newLaunches = sortLaunchesByCreatedAt(
    catalog.filter(
      (launch) =>
        !assigned.has(launch.id) &&
        launch.section !== 'upcoming' &&
        launch.section !== 'ecosystem' &&
        getLaunchCreatedAt(launch) > 0,
    ),
  )

  for (const launch of newLaunches) {
    assigned.add(launch.id)
    launchSectionById.set(launch.id, 'new')
  }

  const upcoming = sortLaunchesByRank(
    catalog.filter(
      (launch) =>
        !assigned.has(launch.id) && launch.section === 'upcoming',
    ),
  )

  for (const launch of upcoming) {
    assigned.add(launch.id)
    launchSectionById.set(launch.id, 'upcoming')
  }

  const ecosystem = sortEcosystemTokens(
    catalog.filter(
      (launch) =>
        !assigned.has(launch.id) && launch.section === 'ecosystem',
    ),
  )

  for (const launch of ecosystem) {
    launchSectionById.set(launch.id, 'ecosystem')
  }

  return {
    featured,
    listed,
    trending,
    newLaunches,
    upcoming,
    ecosystem,
    launchSectionById,
  }
}

function sortEcosystemTokens(items: Launch[]): Launch[] {
  return [...items].sort((left, right) => {
    const leftVerification = getVerificationSortPriority(left)
    const rightVerification = getVerificationSortPriority(right)

    if (rightVerification !== leftVerification) {
      return rightVerification - leftVerification
    }

    const leftName = (
      left.name?.trim() ||
      left.symbol?.trim() ||
      left.id
    ).toLowerCase()
    const rightName = (
      right.name?.trim() ||
      right.symbol?.trim() ||
      right.id
    ).toLowerCase()

    return leftName.localeCompare(rightName, undefined, {
      sensitivity: 'base',
    })
  })
}

export function getLaunchesForHomepageSection(
  sectionId: HomepageSectionId,
  resolved: ResolvedHomepageSections,
): Launch[] {
  switch (sectionId) {
    case 'featured':
      return resolved.featured
    case 'listed':
      return resolved.listed
    case 'trending':
      return resolved.trending
    case 'new':
      return resolved.newLaunches
    case 'upcoming':
      return resolved.upcoming
    case 'ecosystem':
      return resolved.ecosystem
  }
}

export function getLaunchHomepageSection(
  launch: Launch,
  resolved: ResolvedHomepageSections,
): HomepageSectionId | null {
  return resolved.launchSectionById.get(launch.id) ?? null
}

export function getAllHomepageLaunches(
  resolved: ResolvedHomepageSections,
): Launch[] {
  return [
    ...resolved.featured,
    ...resolved.listed,
    ...resolved.trending,
    ...resolved.newLaunches,
    ...resolved.upcoming,
    ...resolved.ecosystem,
  ]
}

export function getTrendingLaunchCandidates(catalog: Launch[]): Launch[] {
  return sortLaunchesByInterest(
    catalog.filter((launch) => (launch.interestCount ?? 0) > 0),
  )
}
