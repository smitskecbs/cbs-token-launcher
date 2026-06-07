import { parseActivityTimestamp } from './activityTimestamp'

const MINUTE_SECONDS = 60
const HOUR_SECONDS = 60 * MINUTE_SECONDS
const DAY_SECONDS = 24 * HOUR_SECONDS
const WEEK_SECONDS = 7 * DAY_SECONDS

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
})

export function formatRelativeTime(iso: string): string | null {
  const normalized = parseActivityTimestamp(iso)

  if (!normalized) {
    return null
  }

  const occurredAt = new Date(normalized).getTime()
  const elapsedSeconds = Math.floor((Date.now() - occurredAt) / 1000)

  if (elapsedSeconds < 0) {
    return 'just now'
  }

  if (elapsedSeconds < MINUTE_SECONDS) {
    return 'just now'
  }

  if (elapsedSeconds < HOUR_SECONDS) {
    const minutes = Math.floor(elapsedSeconds / MINUTE_SECONDS)

    return relativeTimeFormatter.format(-minutes, 'minute')
  }

  if (elapsedSeconds < DAY_SECONDS) {
    const hours = Math.floor(elapsedSeconds / HOUR_SECONDS)

    return relativeTimeFormatter.format(-hours, 'hour')
  }

  if (elapsedSeconds < WEEK_SECONDS) {
    const days = Math.floor(elapsedSeconds / DAY_SECONDS)

    return relativeTimeFormatter.format(-days, 'day')
  }

  const weeks = Math.floor(elapsedSeconds / WEEK_SECONDS)

  if (weeks < 5) {
    return relativeTimeFormatter.format(-weeks, 'week')
  }

  const months = Math.floor(elapsedSeconds / (30 * DAY_SECONDS))

  if (months < 12) {
    return relativeTimeFormatter.format(-months, 'month')
  }

  const years = Math.floor(elapsedSeconds / (365 * DAY_SECONDS))

  return relativeTimeFormatter.format(-years, 'year')
}
