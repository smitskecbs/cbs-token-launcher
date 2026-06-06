import type { TokenMarketData } from '../types/tokenMarketData'
import {
  clearCachedTokenMarketData,
  getCachedTokenMarketData,
  setCachedTokenMarketData,
} from './tokenMarketDataCache'

export const TOKEN_MARKET_DATA_API_PATH = '/api/token-market-data'

export type FetchTokenMarketDataResult =
  | { ok: true; data: TokenMarketData; cached: boolean }
  | { ok: false; message: string }

function resolveTokenMarketDataUrl(mintAddress: string): string {
  const params = new URLSearchParams({ mint: mintAddress.trim() })
  const path = `${TOKEN_MARKET_DATA_API_PATH}?${params.toString()}`

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`
  }

  return path
}

export async function fetchTokenMarketData(
  mintAddress: string,
  options: { forceRefresh?: boolean } = {},
): Promise<FetchTokenMarketDataResult> {
  const trimmedMint = mintAddress.trim()

  if (!options.forceRefresh) {
    const cached = getCachedTokenMarketData(trimmedMint)

    if (cached) {
      return { ok: true, data: cached, cached: true }
    }
  } else {
    clearCachedTokenMarketData(trimmedMint)
  }

  try {
    const response = await fetch(resolveTokenMarketDataUrl(trimmedMint), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      let message =
        'Could not load trading data right now. Please try again later.'

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
      ok: true
      cached?: boolean
      data: TokenMarketData
    }

    setCachedTokenMarketData(trimmedMint, payload.data)

    return {
      ok: true,
      data: payload.data,
      cached: payload.cached === true,
    }
  } catch {
    return {
      ok: false,
      message: 'Could not reach the market data service. Please try again later.',
    }
  }
}
