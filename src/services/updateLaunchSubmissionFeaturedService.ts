import { getAdminAuthHeaders } from './adminSessionService'

export const UPDATE_LAUNCH_SUBMISSION_FEATURED_API_PATH =
  '/api/update-launch-submission-featured'

export type UpdateLaunchSubmissionFeaturedResult =
  | { ok: true; id: string; featured: boolean }
  | { ok: false; message: string; unauthorized?: boolean }

function resolveUpdateLaunchSubmissionFeaturedUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${UPDATE_LAUNCH_SUBMISSION_FEATURED_API_PATH}`
  }

  return UPDATE_LAUNCH_SUBMISSION_FEATURED_API_PATH
}

export async function updateLaunchSubmissionFeatured(
  id: string,
  featured: boolean,
): Promise<UpdateLaunchSubmissionFeaturedResult> {
  try {
    const response = await fetch(resolveUpdateLaunchSubmissionFeaturedUrl(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({ id, featured }),
    })

    if (!response.ok) {
      let message =
        'Could not update featured status. Please try again later.'

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
      ok: true
      id: string
      featured: boolean
    }

    return {
      ok: true,
      id: data.id,
      featured: data.featured,
    }
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the submission service. Please try again later.',
    }
  }
}
