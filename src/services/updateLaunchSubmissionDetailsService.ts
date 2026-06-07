import { getAdminAuthHeaders } from './adminSessionService'
import type { AdminEditSubmissionFormValues } from '../utils/adminEditSubmissionValidation'

export const UPDATE_LAUNCH_SUBMISSION_DETAILS_API_PATH =
  '/api/admin/update-launch-submission-details'

export type UpdateLaunchSubmissionDetailsResult =
  | { ok: true; id: string }
  | { ok: false; message: string; unauthorized?: boolean }

function resolveUpdateLaunchSubmissionDetailsUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${UPDATE_LAUNCH_SUBMISSION_DETAILS_API_PATH}`
  }

  return UPDATE_LAUNCH_SUBMISSION_DETAILS_API_PATH
}

export async function updateLaunchSubmissionDetails(
  id: string,
  values: AdminEditSubmissionFormValues,
): Promise<UpdateLaunchSubmissionDetailsResult> {
  try {
    const response = await fetch(resolveUpdateLaunchSubmissionDetailsUrl(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({
        id,
        projectName: values.projectName,
        tokenSymbol: values.tokenSymbol,
        mintAddress: values.mintAddress,
        logoUrl: values.logoUrl,
        website: values.website,
        telegram: values.telegram,
        x: values.x,
        description: values.description,
        contactEmail: values.contactEmail,
        buyUrl: values.buyUrl,
        poolUrl: values.poolUrl,
        raydiumUrl: values.raydiumUrl,
        jupiterUrl: values.jupiterUrl,
        adminNotes: values.adminNotes,
      }),
    })

    if (!response.ok) {
      let message =
        'Could not save submission changes. Please try again later.'

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
