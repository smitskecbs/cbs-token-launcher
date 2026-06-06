import type { Launch } from '../types/launch'
import { PUBLIC_LAUNCH_UPDATES_API_PATH } from './launchUpdatesService'

export interface LauncherCatalogStatistics {
  totalLaunches: number
  liveLaunches: number
  comingSoonLaunches: number
  communityInterestVotes: number
}

export type FetchLaunchUpdatesTotalCountResult =
  | { ok: true; totalCount: number }
  | { ok: false }

function resolveLaunchUpdatesUrl(searchParams: URLSearchParams): string {
  const query = searchParams.toString()
  const path = `${PUBLIC_LAUNCH_UPDATES_API_PATH}?${query}`

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`
  }

  return path
}

export function computeLauncherCatalogStatistics(
  catalog: Launch[],
): LauncherCatalogStatistics {
  let liveLaunches = 0
  let comingSoonLaunches = 0
  let communityInterestVotes = 0

  for (const launch of catalog) {
    if (launch.status === 'live') {
      liveLaunches += 1
    } else if (launch.status === 'preparing') {
      comingSoonLaunches += 1
    }

    communityInterestVotes += Math.max(0, launch.interestCount ?? 0)
  }

  return {
    totalLaunches: catalog.length,
    liveLaunches,
    comingSoonLaunches,
    communityInterestVotes,
  }
}

export async function fetchLaunchUpdatesTotalCount(): Promise<FetchLaunchUpdatesTotalCountResult> {
  const params = new URLSearchParams({ count: 'total' })

  try {
    const response = await fetch(resolveLaunchUpdatesUrl(params), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return { ok: false }
    }

    const payload = (await response.json()) as {
      totalCount?: number
    }

    const totalCount = Number(payload.totalCount)

    if (!Number.isFinite(totalCount) || totalCount < 0) {
      return { ok: false }
    }

    return {
      ok: true,
      totalCount,
    }
  } catch {
    return { ok: false }
  }
}

export function formatLauncherStatisticValue(value: number): string {
  return value.toLocaleString('en-US')
}
