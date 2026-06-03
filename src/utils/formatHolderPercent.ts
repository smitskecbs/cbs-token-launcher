/** Format a holder concentration percentage from on-chain balances */
export function formatHolderPercent(percent: number): string {
  return `${percent.toFixed(2)}%`
}
