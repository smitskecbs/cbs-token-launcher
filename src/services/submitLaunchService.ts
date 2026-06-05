import type { SubmitLaunchFormValues } from '../utils/submitLaunchValidation'

export const SUBMIT_LAUNCH_API_PATH = '/api/submit-launch'

export interface SubmitLaunchPayload {
  projectName: string
  tokenSymbol: string
  mintAddress: string
  website?: string
  logoUrl?: string
  telegram?: string
  x?: string
  description: string
  contactEmail?: string
}

export type SubmitLaunchResult =
  | { ok: true }
  | { ok: false; message: string }

function resolveSubmitLaunchUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${SUBMIT_LAUNCH_API_PATH}`
  }

  return SUBMIT_LAUNCH_API_PATH
}

function toPayload(values: SubmitLaunchFormValues): SubmitLaunchPayload {
  return {
    projectName: values.projectName,
    tokenSymbol: values.tokenSymbol,
    mintAddress: values.mintAddress,
    description: values.description,
    ...(values.website ? { website: values.website } : {}),
    ...(values.logoUrl ? { logoUrl: values.logoUrl } : {}),
    ...(values.telegram ? { telegram: values.telegram } : {}),
    ...(values.x ? { x: values.x } : {}),
    ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
  }
}

export async function submitLaunchRequest(
  values: SubmitLaunchFormValues,
): Promise<SubmitLaunchResult> {
  try {
    const response = await fetch(resolveSubmitLaunchUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toPayload(values)),
    })

    if (response.status === 201) {
      return { ok: true }
    }

    let message =
      'Could not submit your launch right now. Please try again later.'

    try {
      const data = (await response.json()) as { error?: string }

      if (typeof data.error === 'string' && data.error.trim()) {
        message = data.error.trim()
      }
    } catch {
      // Use generic message when response body is not JSON
    }

    return { ok: false, message }
  } catch {
    return {
      ok: false,
      message:
        'Could not reach the submission service. Please try again later.',
    }
  }
}
