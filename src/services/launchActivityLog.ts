import type { RecentActivityType } from '../types/recentActivity'

const STORAGE_KEY = 'cbs-launcher:recent-activity-log'
const MAX_STORED_ACTIVITIES = 50

export interface StoredLaunchActivity {
  id: string
  type: RecentActivityType
  launchId: string
  occurredAt: string
}

function readStoredActivities(): StoredLaunchActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (entry): entry is StoredLaunchActivity =>
        typeof entry === 'object' &&
        entry != null &&
        typeof entry.id === 'string' &&
        typeof entry.type === 'string' &&
        typeof entry.launchId === 'string' &&
        typeof entry.occurredAt === 'string',
    )
  } catch {
    return []
  }
}

function writeStoredActivities(activities: StoredLaunchActivity[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(activities.slice(0, MAX_STORED_ACTIVITIES)),
  )
}

export function appendLaunchActivityLogEntry(
  entry: Omit<StoredLaunchActivity, 'id'>,
): void {
  const activities = readStoredActivities()
  const id = `${entry.type}-${entry.launchId}-${entry.occurredAt}`

  if (activities.some((activity) => activity.id === id)) {
    return
  }

  writeStoredActivities([{ ...entry, id }, ...activities])
}

export function readLaunchActivityLog(): StoredLaunchActivity[] {
  return readStoredActivities()
}
