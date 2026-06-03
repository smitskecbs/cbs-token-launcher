export function formatDexName(dexId: string): string {
  return dexId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function formatPairName(
  baseSymbol: string | undefined,
  quoteSymbol: string | undefined,
): string | null {
  const base = baseSymbol?.trim()
  const quote = quoteSymbol?.trim()

  if (!base || !quote) {
    return null
  }

  return `${base} / ${quote}`
}
