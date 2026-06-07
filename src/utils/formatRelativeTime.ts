const MINUTE_SECONDS = 60
const HOUR_SECONDS = 60 * MINUTE_SECONDS
const DAY_SECONDS = 24 * HOUR_SECONDS
const WEEK_SECONDS = 7 * DAY_SECONDS

export function formatRelativeTime(iso: string): string {
  const occurredAt = new Date(iso).getTime()

  if (Number.isNaN(occurredAt)) {
    return iso
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - occurredAt) / 1000),
  )

  if (elapsedSeconds < MINUTE_SECONDS) {
    return elapsedSeconds <= 1 ? 'just now' : `${elapsedSeconds} seconds ago`
  }

  if (elapsedSeconds < HOUR_SECONDS) {
    const minutes = Math.floor(elapsedSeconds / MINUTE_SECONDS)

    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  }

  if (elapsedSeconds < DAY_SECONDS) {
    const hours = Math.floor(elapsedSeconds / HOUR_SECONDS)

    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }

  if (elapsedSeconds < WEEK_SECONDS) {
    const days = Math.floor(elapsedSeconds / DAY_SECONDS)

    return days === 1 ? '1 day ago' : `${days} days ago`
  }

  const weeks = Math.floor(elapsedSeconds / WEEK_SECONDS)

  if (weeks < 5) {
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  }

  const months = Math.floor(elapsedSeconds / (30 * DAY_SECONDS))

  if (months < 12) {
    return months === 1 ? '1 month ago' : `${months} months ago`
  }

  const years = Math.floor(elapsedSeconds / (365 * DAY_SECONDS))

  return years === 1 ? '1 year ago' : `${years} years ago`
}
