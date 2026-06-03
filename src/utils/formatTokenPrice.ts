import { formatPrice } from './formatPrice'

/** @deprecated Use formatPrice() */
export function formatTokenPriceUsd(priceUsd: number): string {
  return formatPrice(priceUsd)
}
