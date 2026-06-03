import { launches } from '../data/launches'

import type { EnrichedLaunch, Launch, LaunchStatus } from '../types/launch'

import { enrichLaunchFromSolana } from './integrations/solanaMetadata'

import { enrichLaunchWithMarketData } from './integrations/marketData'

import { getSubmittedLaunchesAsLaunches } from './submittedLaunchesStorage'

import { sortLaunchesByRank, getVerificationSortPriority } from './launchRankingService'

/** Static catalog entries plus locally submitted launches */
export function getLaunchCatalog(): Launch[] {
  return [...launches, ...getSubmittedLaunchesAsLaunches()]
}

function getLaunchDisplayName(launch: Launch): string {
  return (
    launch.name?.trim() ||
    launch.symbol?.trim() ||
    launch.id
  ).toLowerCase()
}

function sortEcosystemTokens(items: Launch[]): Launch[] {
  return [...items].sort((left, right) => {
    const leftVerification = getVerificationSortPriority(left)
    const rightVerification = getVerificationSortPriority(right)

    if (rightVerification !== leftVerification) {
      return rightVerification - leftVerification
    }

    return getLaunchDisplayName(left).localeCompare(
      getLaunchDisplayName(right),
      undefined,
      { sensitivity: 'base' },
    )
  })
}

/** Featured Launches — CBS verified first, then highest ranked */
export function getFeaturedLaunches(
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  return sortLaunchesByRank(
    catalog.filter((launch) => launch.section === 'featured'),
  )
}

/** CBS Ecosystem Tokens — CBS verified first, then alphabetical */
export function getEcosystemTokens(
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  return sortEcosystemTokens(
    catalog.filter((launch) => launch.section === 'ecosystem'),
  )
}

/** Upcoming Launches — CBS verified first, then highest ranked */
export function getUpcomingLaunches(
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  return sortLaunchesByRank(
    catalog.filter((launch) => launch.section === 'upcoming'),
  )
}

export function getLaunchesByStatus(
  status: LaunchStatus,
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  return catalog.filter((launch) => launch.status === status)
}

export function getLaunchById(
  id: string,
  catalog: Launch[] = getLaunchCatalog(),
): Launch | undefined {
  return catalog.find((launch) => launch.id === id)
}

/**
 * Future Phase — full launch enrichment pipeline.
 * Wire into renderApp() once RPC and API keys are configured.
 */
export async function enrichLaunch(launch: Launch): Promise<EnrichedLaunch> {
  const withChain = await enrichLaunchFromSolana(launch)
  return enrichLaunchWithMarketData(withChain)
}

export async function enrichAllLaunches(
  catalog: Launch[] = launches,
): Promise<EnrichedLaunch[]> {
  return Promise.all(catalog.map((launch) => enrichLaunch(launch)))
}


