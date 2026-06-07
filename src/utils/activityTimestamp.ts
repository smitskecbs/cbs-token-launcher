const MAX_FUTURE_SKEW_MS = 60_000

export function parseActivityTimestamp(
  value: string | number | null | undefined,
): string | null {
  if (value == null) {
    return null
  }

  let parsedMs: number

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) {
      return null
    }

    parsedMs = value
  } else {
    const trimmed = value.trim()

    if (!trimmed) {
      return null
    }

    parsedMs = Date.parse(trimmed)
  }

  if (Number.isNaN(parsedMs) || parsedMs <= 0) {
    return null
  }

  if (parsedMs > Date.now() + MAX_FUTURE_SKEW_MS) {
    return null
  }

  return new Date(parsedMs).toISOString()
}
