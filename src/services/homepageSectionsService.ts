import type { Launch } from '../types/launch'
import type { HomepageSectionId } from '../types/homepage'
import {
  getVerificationSortPriority,
  sortLaunchesByRank,
} from './launchRankingService'

export type { HomepageSectionId } from '../types/homepage'

export interface ResolvedHomepageSections {
  featured: Launch[]
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

function sortLaunchesByCreatedAt(launches: Launch[]): Launch[] {
  return [...launches].sort(
    (left, right) =>
      getLaunchCreatedAt(right) - getLaunchCreatedAt(left),
  )
}

/**
 * Assign each launch to a single homepage section.
 * Priority: Featured > Trending > New > Upcoming > Ecosystem
 */
export function resolveHomepageSections(
  catalog: Launch[],
): ResolvedHomepageSections {
  const assigned = new Set<string>()
  const launchSectionById = new Map<string, HomepageSectionId>()

  const featured = sortLaunchesByRank(
    catalog.filter((launch) => isFeaturedLaunch(launch)),
  )

  for (const launch of featured) {
    assigned.add(launch.id)
    launchSectionById.set(launch.id, 'featured')
  }

  // Reserved for future analytics-driven trending rankings
  const trending: Launch[] = []

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
    ...resolved.trending,
    ...resolved.newLaunches,
    ...resolved.upcoming,
    ...resolved.ecosystem,
  ]
}

/** Future hook — returns launches eligible for trending once analytics exist */
export function getTrendingLaunchCandidates(
  _catalog: Launch[],
): Launch[] {
  return []
}
