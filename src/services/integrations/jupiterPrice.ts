const JUPITER_PRICE_URL = 'https://lite-api.jup.ag/price/v3'

export interface JupiterPriceQuote {
  priceUsd: number
  liquidityUsd: number | null
}

interface JupiterPriceEntry {
  usdPrice?: number
  liquidity?: number
}

type JupiterPriceResponse = Record<string, JupiterPriceEntry | undefined>

/** Read-only price and liquidity quote from Jupiter Price API */
export async function fetchJupiterPriceQuote(
  mintAddress: string,
): Promise<JupiterPriceQuote | null> {
  const trimmed = mintAddress.trim()

  try {
    const response = await fetch(
      `${JUPITER_PRICE_URL}?ids=${encodeURIComponent(trimmed)}`,
    )

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as JupiterPriceResponse
    const entry = data[trimmed]

    if (!entry || typeof entry.usdPrice !== 'number') {
      return null
    }

    const liquidityUsd =
      typeof entry.liquidity === 'number' && entry.liquidity > 0
        ? entry.liquidity
        : null

    return {
      priceUsd: entry.usdPrice,
      liquidityUsd,
    }
  } catch {
    return null
  }
}
