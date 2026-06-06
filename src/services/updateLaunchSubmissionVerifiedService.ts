import { getAdminAuthHeaders } from './adminSessionService'

export const UPDATE_LAUNCH_SUBMISSION_VERIFIED_API_PATH =
  '/api/admin/update-launch-submission-verified'

export type UpdateLaunchSubmissionVerifiedResult =
  | { ok: true; id: string; verified: boolean }
  | { ok: false; message: string; unauthorized?: boolean }

function resolveUpdateLaunchSubmissionVerifiedUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${UPDATE_LAUNCH_SUBMISSION_VERIFIED_API_PATH}`
  }

  return UPDATE_LAUNCH_SUBMISSION_VERIFIED_API_PATH
}

export async function updateLaunchSubmissionVerified(
  id: string,
  verified: boolean,
): Promise<UpdateLaunchSubmissionVerifiedResult> {
  try {
    const response = await fetch(resolveUpdateLaunchSubmissionVerifiedUrl(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({ id, verified }),
    })

    if (!response.ok) {
      let message =
        'Could not update verified status. Please try again later.'

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
      verified: boolean
    }

    return {
      ok: true,
      id: data.id,
      verified: data.verified,
    }
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the submission service. Please try again later.',
    }
  }
}
