import type { HomepageLaunchesResponse } from '../types/homepageLaunch'

export const HOMEPAGE_LAUNCHES_API_PATH = '/api/homepage-launches'

export type FetchHomepageLaunchesResult =
  | { ok: true; count: number; launches: HomepageLaunchesResponse['launches'] }
  | { ok: false; message: string }

function resolveHomepageLaunchesUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${HOMEPAGE_LAUNCHES_API_PATH}`
  }

  return HOMEPAGE_LAUNCHES_API_PATH
}

export async function fetchHomepageLaunches(): Promise<FetchHomepageLaunchesResult> {
  try {
    const response = await fetch(resolveHomepageLaunchesUrl(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      let message =
        'Could not load homepage launches right now. Please try again later.'

      try {
        const data = (await response.json()) as { error?: string }

        if (typeof data.error === 'string' && data.error.trim()) {
          message = data.error.trim()
        }
      } catch {
        // Use generic message when response body is not JSON
      }

      return { ok: false, message }
    }

    const data = (await response.json()) as HomepageLaunchesResponse

    return {
      ok: true,
      count: data.count,
      launches: data.launches,
    }
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the launch service. Please try again later.',
    }
  }
}
