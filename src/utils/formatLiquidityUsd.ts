import { formatLiquidity } from './formatLiquidity'

/** @deprecated Use formatLiquidity() */
export function formatLiquidityUsd(liquidityUsd: number): string {
  return formatLiquidity(liquidityUsd)
}
