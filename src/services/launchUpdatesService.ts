import type { LaunchUpdate } from '../types/launchUpdate'
import type { LaunchUpdateTarget } from '../utils/launchUpdateTarget'
import { getAdminAuthHeaders } from './adminSessionService'

export const LAUNCH_UPDATES_API_PATH = '/api/launch-updates'

export type FetchLaunchUpdatesResult =
  | { ok: true; updates: LaunchUpdate[] }
  | { ok: false; message: string }

export type CreateLaunchUpdateResult =
  | { ok: true; update: LaunchUpdate }
  | { ok: false; message: string; unauthorized?: boolean }

export type DeleteLaunchUpdateResult =
  | { ok: true; id: string }
  | { ok: false; message: string; unauthorized?: boolean }

function resolveLaunchUpdatesUrl(searchParams?: URLSearchParams): string {
  const query = searchParams?.toString()
  const path = query
    ? `${LAUNCH_UPDATES_API_PATH}?${query}`
    : LAUNCH_UPDATES_API_PATH

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`
  }

  return path
}

function buildTargetSearchParams(target: LaunchUpdateTarget): URLSearchParams {
  const params = new URLSearchParams()

  if (target.submissionId) {
    params.set('submissionId', target.submissionId)
  } else if (target.launchId) {
    params.set('launchId', target.launchId)
  }

  return params
}

export async function fetchLaunchUpdates(
  target: LaunchUpdateTarget,
): Promise<FetchLaunchUpdatesResult> {
  const params = buildTargetSearchParams(target)

  if (!params.has('submissionId') && !params.has('launchId')) {
    return { ok: false, message: 'Launch target is invalid.' }
  }

  try {
    const response = await fetch(resolveLaunchUpdatesUrl(params), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return {
        ok: false,
        message: 'Could not load launch updates right now.',
      }
    }

    const payload = (await response.json()) as {
      updates?: LaunchUpdate[]
    }

    return {
      ok: true,
      updates: Array.isArray(payload.updates) ? payload.updates : [],
    }
  } catch {
    return {
      ok: false,
      message: 'Could not load launch updates right now.',
    }
  }
}

export async function createLaunchUpdate(
  target: LaunchUpdateTarget,
  values: { title: string; content: string },
): Promise<CreateLaunchUpdateResult> {
  try {
    const response = await fetch(resolveLaunchUpdatesUrl(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({
        submissionId: target.submissionId,
        launchId: target.launchId,
        title: values.title,
        content: values.content,
      }),
    })

    if (!response.ok) {
      let message = 'Could not save launch update right now.'

      try {
        const payload = (await response.json()) as { error?: string }

        if (typeof payload.error === 'string' && payload.error.trim()) {
          message = payload.error.trim()
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

    const payload = (await response.json()) as { update: LaunchUpdate }

    return {
      ok: true,
      update: payload.update,
    }
  } catch {
    return {
      ok: false,
      message: 'Could not reach the launch updates service.',
    }
  }
}

export async function deleteLaunchUpdate(
  updateId: string,
): Promise<DeleteLaunchUpdateResult> {
  try {
    const response = await fetch(resolveLaunchUpdatesUrl(), {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({ id: updateId }),
    })

    if (!response.ok) {
      let message = 'Could not delete launch update right now.'

      try {
        const payload = (await response.json()) as { error?: string }

        if (typeof payload.error === 'string' && payload.error.trim()) {
          message = payload.error.trim()
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

    const payload = (await response.json()) as { id: string }

    return {
      ok: true,
      id: payload.id,
    }
  } catch {
    return {
      ok: false,
      message: 'Could not reach the launch updates service.',
    }
  }
}
