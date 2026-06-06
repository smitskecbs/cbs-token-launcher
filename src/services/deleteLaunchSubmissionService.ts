import { getAdminAuthHeaders } from './adminSessionService'

export const DELETE_LAUNCH_SUBMISSION_API_PATH =
  '/api/admin/delete-launch-submission'

export type DeleteLaunchSubmissionResult =
  | { ok: true; id: string }
  | { ok: false; message: string; unauthorized?: boolean }

function resolveDeleteLaunchSubmissionUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DELETE_LAUNCH_SUBMISSION_API_PATH}`
  }

  return DELETE_LAUNCH_SUBMISSION_API_PATH
}

export async function deleteLaunchSubmission(
  id: string,
): Promise<DeleteLaunchSubmissionResult> {
  try {
    const response = await fetch(resolveDeleteLaunchSubmissionUrl(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      let message = 'Could not delete submission. Please try again later.'

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

    const data = (await response.json()) as { ok: true; id: string }

    return {
      ok: true,
      id: data.id,
    }
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the submission service. Please try again later.',
    }
  }
}
