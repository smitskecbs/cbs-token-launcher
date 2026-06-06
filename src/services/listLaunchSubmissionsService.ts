import { getAdminAuthHeaders } from './adminSessionService'
import type { ListLaunchSubmissionsResponse } from '../types/launchSubmission'

export const LIST_LAUNCH_SUBMISSIONS_API_PATH =
  '/api/list-launch-submissions'

export type ListLaunchSubmissionsResult =
  | { ok: true; count: number; submissions: ListLaunchSubmissionsResponse['submissions'] }
  | { ok: false; message: string; unauthorized?: boolean }

function resolveListLaunchSubmissionsUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${LIST_LAUNCH_SUBMISSIONS_API_PATH}`
  }

  return LIST_LAUNCH_SUBMISSIONS_API_PATH
}

export async function fetchLaunchSubmissions(): Promise<ListLaunchSubmissionsResult> {
  try {
    const response = await fetch(resolveListLaunchSubmissionsUrl(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAdminAuthHeaders(),
      },
    })

    if (!response.ok) {
      let message =
        'Could not load submissions right now. Please try again later.'

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

    const data = (await response.json()) as ListLaunchSubmissionsResponse

    return {
      ok: true,
      count: data.count,
      submissions: data.submissions,
    }
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the submission service. Please try again later.',
    }
  }
}
