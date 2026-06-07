import { getAdminAuthHeaders } from './adminSessionService'
import type {
  LaunchEngagementAnalyticsTarget,
  LaunchEngagementMetricsMap,
} from '../types/launchEngagementMetrics'

export const TRACK_LAUNCH_PAGE_VIEW_API_PATH =
  '/api/public/track-launch-page-view'
export const ADMIN_LAUNCH_ANALYTICS_API_PATH = '/api/admin/launch-analytics'

export type TrackLaunchPageViewResult =
  | { ok: true; launchId: string; pageViews: number }
  | { ok: false }

export type FetchLaunchEngagementAnalyticsResult =
  | { ok: true; analytics: LaunchEngagementMetricsMap }
  | { ok: false; message: string; unauthorized?: boolean }

function resolveApiUrl(path: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`
  }

  return path
}

export async function trackLaunchPageView(
  launchId: string,
): Promise<TrackLaunchPageViewResult> {
  const trimmedLaunchId = launchId.trim()

  if (!trimmedLaunchId) {
    return { ok: false }
  }

  try {
    const response = await fetch(resolveApiUrl(TRACK_LAUNCH_PAGE_VIEW_API_PATH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ launchId: trimmedLaunchId }),
    })

    if (!response.ok) {
      return { ok: false }
    }

    const data = (await response.json()) as {
      launchId?: string
      pageViews?: number
    }

    return {
      ok: true,
      launchId: data.launchId?.trim() || trimmedLaunchId,
      pageViews: Math.max(0, Number(data.pageViews) || 0),
    }
  } catch {
    return { ok: false }
  }
}

export async function fetchLaunchEngagementAnalytics(
  targets: LaunchEngagementAnalyticsTarget[],
): Promise<FetchLaunchEngagementAnalyticsResult> {
  if (targets.length === 0) {
    return {
      ok: true,
      analytics: {},
    }
  }

  try {
    const response = await fetch(resolveApiUrl(ADMIN_LAUNCH_ANALYTICS_API_PATH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({ targets }),
    })

    if (!response.ok) {
      let message = 'Could not load launch analytics right now.'

      try {
        const data = (await response.json()) as { error?: string }

        if (typeof data.error === 'string' && data.error.trim()) {
          message = data.error.trim()
        }
      } catch {
        // Use generic message when response body is not JSON
      }

      return {
        ok: false,
        message,
        unauthorized: response.status === 401,
      }
    }

    const data = (await response.json()) as {
      analytics?: LaunchEngagementMetricsMap
    }

    return {
      ok: true,
      analytics: data.analytics ?? {},
    }
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the analytics service. Please try again later.',
    }
  }
}
