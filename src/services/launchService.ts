import { launches } from '../data/launches'

import type { EnrichedLaunch, Launch, LaunchStatus } from '../types/launch'

import { enrichLaunchFromSolana } from './integrations/solanaMetadata'

import { enrichLaunchWithMarketData } from './integrations/marketData'

import { getSubmittedLaunchesAsLaunches } from './submittedLaunchesStorage'

import {
  getAllHomepageLaunches,
  getLaunchesForHomepageSection,
  resolveHomepageSections,
} from './homepageSectionsService'

/** Static catalog entries plus locally submitted launches */
export function getLaunchCatalog(): Launch[] {
  return [...launches, ...getSubmittedLaunchesAsLaunches()]
}

/** Featured Launches — featured flag or featured section, deduplicated */
export function getFeaturedLaunches(
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  return resolveHomepageSections(catalog).featured
}

/** CBS Ecosystem Tokens — ecosystem section, deduplicated */
export function getEcosystemTokens(
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  return resolveHomepageSections(catalog).ecosystem
}

/** Upcoming Launches — upcoming section, deduplicated */
export function getUpcomingLaunches(
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  return resolveHomepageSections(catalog).upcoming
}

/** New Launches — sorted by creation date, deduplicated */
export function getNewLaunches(
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  return resolveHomepageSections(catalog).newLaunches
}

/** Trending Launches — placeholder until analytics are wired */
export function getTrendingLaunches(
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  return resolveHomepageSections(catalog).trending
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

export function getHomepageSectionLaunches(
  launch: Launch,
  catalog: Launch[] = getLaunchCatalog(),
): Launch[] {
  const resolved = resolveHomepageSections(catalog)
  const sectionId = resolved.launchSectionById.get(launch.id)

  if (!sectionId) {
    return []
  }

  return getLaunchesForHomepageSection(sectionId, resolved)
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

export { getAllHomepageLaunches, resolveHomepageSections }
