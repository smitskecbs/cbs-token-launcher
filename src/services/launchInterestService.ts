export const LAUNCH_INTEREST_API_PATH = '/api/public/launch-interest'

export type PostLaunchInterestResult =
  | { ok: true; mintAddress: string; interestCount: number }
  | { ok: false; message: string }

export type FetchLaunchInterestCountsResult =
  | { ok: true; counts: Record<string, number> }
  | { ok: false; message: string }

function resolveLaunchInterestUrl(searchParams?: URLSearchParams): string {
  const query = searchParams?.toString()
  const path = query
    ? `${LAUNCH_INTEREST_API_PATH}?${query}`
    : LAUNCH_INTEREST_API_PATH

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`
  }

  return path
}

export async function postLaunchInterest(
  mintAddress: string,
): Promise<PostLaunchInterestResult> {
  const trimmedMint = mintAddress.trim()

  try {
    const response = await fetch(resolveLaunchInterestUrl(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mintAddress: trimmedMint }),
    })

    if (!response.ok) {
      let message =
        'Could not register interest right now. Please try again later.'

      try {
        const payload = (await response.json()) as { error?: string }

        if (typeof payload.error === 'string' && payload.error.trim()) {
          message = payload.error.trim()
        }
      } catch {
        // Use generic message when response body is not JSON
      }

      return { ok: false, message }
    }

    const payload = (await response.json()) as {
      interestCount?: number
      mintAddress?: string
    }

    return {
      ok: true,
      mintAddress: payload.mintAddress?.trim() || trimmedMint,
      interestCount: Math.max(0, Number(payload.interestCount) || 0),
    }
  } catch {
    return {
      ok: false,
      message: 'Could not register interest right now. Please try again later.',
    }
  }
}

export async function fetchLaunchInterestCounts(
  mintAddresses: string[],
): Promise<FetchLaunchInterestCountsResult> {
  const mints = [
    ...new Set(mintAddresses.map((mint) => mint.trim()).filter(Boolean)),
  ]

  if (mints.length === 0) {
    return { ok: true, counts: {} }
  }

  const params = new URLSearchParams({ mints: mints.join(',') })

  try {
    const response = await fetch(resolveLaunchInterestUrl(params), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return {
        ok: false,
        message: 'Could not load interest counts right now.',
      }
    }

    const payload = (await response.json()) as {
      counts?: Record<string, number>
    }
    const counts: Record<string, number> = {}

    for (const mint of mints) {
      counts[mint] = Math.max(0, Number(payload.counts?.[mint]) || 0)
    }

    return { ok: true, counts }
  } catch {
    return {
      ok: false,
      message: 'Could not load interest counts right now.',
    }
  }
}
