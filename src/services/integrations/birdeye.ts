import type { JupiterPriceQuote } from './jupiterPrice'

/**
 * Future Phase — optional Birdeye price fallback.
 *
 * Wire when VITE_BIRDEYE_API_KEY is configured:
 * GET https://public-api.birdeye.so/defi/price?address={mint}
 */
export async function fetchBirdeyePriceQuote(
  _mintAddress: string,
): Promise<JupiterPriceQuote | null> {
  return null
}
