import { getAdminAuthHeaders } from './adminSessionService'
import type { LaunchSubmissionStatus } from '../utils/launchSubmissionStatus'

export const UPDATE_LAUNCH_SUBMISSION_STATUS_API_PATH =
  '/api/update-launch-submission-status'

export type UpdateLaunchSubmissionStatusResult =
  | { ok: true; id: string; status: LaunchSubmissionStatus }
  | { ok: false; message: string; unauthorized?: boolean }

function resolveUpdateLaunchSubmissionStatusUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${UPDATE_LAUNCH_SUBMISSION_STATUS_API_PATH}`
  }

  return UPDATE_LAUNCH_SUBMISSION_STATUS_API_PATH
}

export async function updateLaunchSubmissionStatus(
  id: string,
  status: LaunchSubmissionStatus,
): Promise<UpdateLaunchSubmissionStatusResult> {
  try {
    const response = await fetch(resolveUpdateLaunchSubmissionStatusUrl(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({ id, status }),
    })

    if (!response.ok) {
      let message =
        'Could not update submission status. Please try again later.'

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
      status: LaunchSubmissionStatus
    }

    return {
      ok: true,
      id: data.id,
      status: data.status,
    }
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the submission service. Please try again later.',
    }
  }
}
