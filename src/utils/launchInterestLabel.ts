export function formatLaunchInterestLabel(count: number): string {
  const safeCount = Math.max(0, Math.floor(count))

  if (safeCount === 0) {
    return 'Be the first interested'
  }

  if (safeCount === 1) {
    return '1 person interested'
  }

  return `${safeCount} people interested`
}

export function formatLaunchInterestButtonText(count: number): string {
  return `🚀 ${formatLaunchInterestLabel(count)}`
}

/** Compact card display, e.g. "🚀 12 interested" */
export function formatLaunchInterestCompact(count: number): string {
  const safeCount = Math.max(0, Math.floor(count))

  if (safeCount === 0) {
    return '🚀 Be the first interested'
  }

  if (safeCount === 1) {
    return '🚀 1 interested'
  }

  return `🚀 ${safeCount} interested`
}
