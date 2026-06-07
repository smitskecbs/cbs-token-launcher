import type { Launch } from '../types/launch'
import type { LaunchUpdate } from '../types/launchUpdate'
import type {
  RecentActivityItem,
  RecentActivityType,
} from '../types/recentActivity'
import type { StoredLaunchActivity } from './launchActivityLog'
import { resolveLatestUpdates } from './resolveLatestUpdates'

const RECENT_ACTIVITY_LIMIT = 10

function resolveLaunchTimestamp(launch: Launch): string | null {
  const timestamp = launch.submittedAt ?? launch.createdAt

  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    return null
  }

  return new Date(timestamp).toISOString()
}

function buildCatalogActivities(catalog: Launch[]): RecentActivityItem[] {
  const activities: RecentActivityItem[] = []

  for (const launch of catalog) {
    const occurredAt = resolveLaunchTimestamp(launch)

    if (!occurredAt) {
      continue
    }

    const isSubmission = launch.id.startsWith('submission-')

    if (isSubmission) {
      activities.push({
        id: `new_launch_submitted-${launch.id}-${occurredAt}`,
        type: 'new_launch_submitted',
        launch,
        occurredAt,
      })
    }

    if (
      launch.verificationLevel === 'verified' ||
      launch.verificationLevel === 'cbs-verified'
    ) {
      activities.push({
        id: `launch_approved-${launch.id}-${occurredAt}`,
        type: 'launch_approved',
        launch,
        occurredAt,
      })
    }

    if (launch.status === 'preparing') {
      activities.push({
        id: `launch_moved_to_coming_soon-${launch.id}-${occurredAt}`,
        type: 'launch_moved_to_coming_soon',
        launch,
        occurredAt,
      })
    }

    if (launch.status === 'live') {
      activities.push({
        id: `launch_moved_to_live-${launch.id}-${occurredAt}`,
        type: 'launch_moved_to_live',
        launch,
        occurredAt,
      })
    }

    if ((launch.interestCount ?? 0) > 0) {
      activities.push({
        id: `interest_vote_received-${launch.id}-${occurredAt}`,
        type: 'interest_vote_received',
        launch,
        occurredAt,
      })
    }
  }

  return activities
}

function buildUpdateActivities(
  updates: LaunchUpdate[],
  catalog: Launch[],
): RecentActivityItem[] {
  const resolved = resolveLatestUpdates(updates, catalog)

  return resolved.map(({ update, launch }) => ({
    id: `launch_update_posted-${update.id}`,
    type: 'launch_update_posted',
    launch,
    occurredAt: update.createdAt,
  }))
}

function buildLoggedActivities(
  storedActivities: StoredLaunchActivity[],
  catalog: Launch[],
): RecentActivityItem[] {
  const launchesById = new Map(catalog.map((launch) => [launch.id, launch]))
  const items: RecentActivityItem[] = []

  for (const entry of storedActivities) {
    const launch = launchesById.get(entry.launchId)

    if (!launch) {
      continue
    }

    items.push({
      id: entry.id,
      type: entry.type,
      launch,
      occurredAt: entry.occurredAt,
    })
  }

  return items
}

function compareRecentActivity(
  left: RecentActivityItem,
  right: RecentActivityItem,
): number {
  const leftTime = new Date(left.occurredAt).getTime()
  const rightTime = new Date(right.occurredAt).getTime()

  if (rightTime !== leftTime) {
    return rightTime - leftTime
  }

  return left.id.localeCompare(right.id)
}

function dedupeRecentActivities(
  activities: RecentActivityItem[],
): RecentActivityItem[] {
  const seen = new Set<string>()
  const deduped: RecentActivityItem[] = []

  for (const activity of activities.sort(compareRecentActivity)) {
    const key = `${activity.type}-${activity.launch.id}-${activity.occurredAt}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(activity)
  }

  return deduped
}

export function resolveRecentActivity(
  updates: LaunchUpdate[],
  catalog: Launch[],
  storedActivities: StoredLaunchActivity[] = [],
): RecentActivityItem[] {
  const loggedInterestLaunchIds = new Set(
    storedActivities
      .filter((entry) => entry.type === 'interest_vote_received')
      .map((entry) => entry.launchId),
  )

  const catalogActivities = buildCatalogActivities(catalog).filter(
    (activity) =>
      activity.type !== 'interest_vote_received' ||
      !loggedInterestLaunchIds.has(activity.launch.id),
  )

  const activities = dedupeRecentActivities([
    ...buildUpdateActivities(updates, catalog),
    ...catalogActivities,
    ...buildLoggedActivities(storedActivities, catalog),
  ])

  return activities.slice(0, RECENT_ACTIVITY_LIMIT)
}

export function formatRecentActivityText(type: RecentActivityType): string {
  switch (type) {
    case 'new_launch_submitted':
      return 'submitted a launch'
    case 'launch_approved':
      return 'was approved'
    case 'launch_moved_to_coming_soon':
      return 'moved to Coming Soon'
    case 'launch_moved_to_live':
      return 'moved to Live'
    case 'interest_vote_received':
      return 'received an interest vote'
    case 'launch_update_posted':
      return 'posted an update'
  }
}
