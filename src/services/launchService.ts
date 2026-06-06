import { launches } from '../data/launches'

import type { EnrichedLaunch, Launch, LaunchStatus } from '../types/launch'

import { enrichLaunchFromSolana } from './integrations/solanaMetadata'

import { enrichLaunchWithMarketData } from './integrations/marketData'

import { getSubmittedLaunchesAsLaunches } from './submittedLaunchesStorage'

import { fetchHomepageLaunches } from './homepageLaunchesService'

import { mapSubmissionToLaunch } from './mapSubmissionToLaunch'
import { fetchLaunchInterestCounts } from './launchInterestService'

import {
  getAllHomepageLaunches,
  getLaunchesForHomepageSection,
  resolveHomepageSections,
} from './homepageSectionsService'

let cachedCatalog: Launch[] | null = null

/** Built-in catalog plus any locally submitted launches */
export function getStaticLaunchCatalog(): Launch[] {
  return [...launches, ...getSubmittedLaunchesAsLaunches()]
}

function mergeLaunchCatalog(
  staticCatalog: Launch[],
  remoteLaunches: Launch[],
): Launch[] {
  const seenMints = new Set(
    staticCatalog.map((launch) => launch.mintAddress.trim()),
  )
  const merged = [...staticCatalog]

  for (const launch of remoteLaunches) {
    const mintAddress = launch.mintAddress.trim()

    if (!mintAddress || seenMints.has(mintAddress)) {
      continue
    }

    merged.push(launch)
    seenMints.add(mintAddress)
  }

  return merged
}

async function enrichCatalogWithInterestCounts(
  catalog: Launch[],
): Promise<Launch[]> {
  const mints = catalog
    .map((launch) => launch.mintAddress.trim())
    .filter(Boolean)
  const result = await fetchLaunchInterestCounts(mints)

  if (!result.ok) {
    return catalog
  }

  return catalog.map((launch) => {
    const mintAddress = launch.mintAddress.trim()
    const remoteCount = result.counts[mintAddress] ?? 0

    return {
      ...launch,
      interestCount: Math.max(launch.interestCount ?? 0, remoteCount),
    }
  })
}

export interface LoadLaunchCatalogOptions {
  refresh?: boolean
}

/** Load catalog from static entries plus Supabase homepage launches */
export async function loadLaunchCatalog(
  options: LoadLaunchCatalogOptions = {},
): Promise<Launch[]> {
  if (!options.refresh && cachedCatalog) {
    return cachedCatalog
  }

  const staticCatalog = getStaticLaunchCatalog()
  const remoteResult = await fetchHomepageLaunches()

  if (!remoteResult.ok) {
    cachedCatalog = await enrichCatalogWithInterestCounts(staticCatalog)
    return cachedCatalog
  }

  const remoteLaunches = remoteResult.launches.map(mapSubmissionToLaunch)
  const mergedCatalog = mergeLaunchCatalog(staticCatalog, remoteLaunches)
  cachedCatalog = await enrichCatalogWithInterestCounts(mergedCatalog)

  return cachedCatalog
}

/** Static catalog entries plus locally submitted launches and cached Supabase launches */
export function getLaunchCatalog(): Launch[] {
  return cachedCatalog ?? getStaticLaunchCatalog()
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
