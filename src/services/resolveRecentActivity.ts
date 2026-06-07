import type { Launch } from '../types/launch'
import type { LaunchUpdate } from '../types/launchUpdate'
import type { LaunchSubmissionSummary } from '../types/launchSubmission'
import type {
  RecentActivityItem,
  RecentActivityType,
  ResolvedRecentActivityItem,
} from '../types/recentActivity'
import { parseActivityTimestamp } from '../utils/activityTimestamp'
import { mapAdminSubmissionToLaunch } from '../utils/mapAdminSubmissionToLaunch'
import {
  hasPublicLaunchDetailPage,
  resolveRecentActivityNavigation,
} from '../utils/recentActivityNavigation'
import type { StoredLaunchActivity } from './launchActivityLog'
import { resolveLatestUpdates } from './resolveLatestUpdates'

export interface ResolveRecentActivityOptions {
  isAdmin?: boolean
  pendingSubmissions?: LaunchSubmissionSummary[]
}

const RECENT_ACTIVITY_LIMIT = 10

function buildSubmissionActivities(catalog: Launch[]): RecentActivityItem[] {
  const activities: RecentActivityItem[] = []

  for (const launch of catalog) {
    if (!launch.id.startsWith('submission-')) {
      continue
    }

    if (!hasPublicLaunchDetailPage(launch)) {
      continue
    }

    const occurredAt = parseActivityTimestamp(
      launch.submittedAt ?? launch.createdAt,
    )

    if (!occurredAt) {
      continue
    }

    activities.push({
      id: `new_launch_submitted-${launch.id}-${occurredAt}`,
      type: 'new_launch_submitted',
      launch,
      occurredAt,
    })
  }

  return activities
}

function buildPendingSubmissionActivities(
  pendingSubmissions: LaunchSubmissionSummary[],
  catalog: Launch[],
): RecentActivityItem[] {
  const listedSubmissionIds = new Set(
    catalog
      .filter((launch) => launch.id.startsWith('submission-'))
      .map((launch) => launch.id.slice('submission-'.length)),
  )
  const activities: RecentActivityItem[] = []

  for (const submission of pendingSubmissions) {
    if (submission.status !== 'pending') {
      continue
    }

    if (listedSubmissionIds.has(submission.id)) {
      continue
    }

    const occurredAt = parseActivityTimestamp(submission.createdAt)

    if (!occurredAt) {
      continue
    }

    const launch = mapAdminSubmissionToLaunch(submission)

    activities.push({
      id: `new_launch_submitted-pending-${submission.id}-${occurredAt}`,
      type: 'new_launch_submitted',
      launch,
      occurredAt,
    })
  }

  return activities
}

function buildUpdateActivities(
  updates: LaunchUpdate[],
  catalog: Launch[],
): RecentActivityItem[] {
  const resolved = resolveLatestUpdates(updates, catalog)
  const activities: RecentActivityItem[] = []

  for (const { update, launch } of resolved) {
    const occurredAt = parseActivityTimestamp(update.createdAt)

    if (!occurredAt) {
      continue
    }

    activities.push({
      id: `launch_update_posted-${update.id}`,
      type: 'launch_update_posted',
      launch,
      occurredAt,
    })
  }

  return activities
}

function buildLoggedActivities(
  storedActivities: StoredLaunchActivity[],
  catalog: Launch[],
): RecentActivityItem[] {
  const launchesById = new Map(catalog.map((launch) => [launch.id, launch]))
  const items: RecentActivityItem[] = []

  for (const entry of storedActivities) {
    if (entry.type !== 'interest_vote_received') {
      continue
    }

    const occurredAt = parseActivityTimestamp(entry.occurredAt)

    if (!occurredAt) {
      continue
    }

    const launch = launchesById.get(entry.launchId)

    if (!launch) {
      continue
    }

    items.push({
      id: entry.id,
      type: entry.type,
      launch,
      occurredAt,
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

function attachNavigation(
  activities: RecentActivityItem[],
  isAdmin: boolean,
): ResolvedRecentActivityItem[] {
  const resolved: ResolvedRecentActivityItem[] = []

  for (const activity of activities) {
    const navigation = resolveRecentActivityNavigation(activity, isAdmin)

    if (!navigation) {
      continue
    }

    resolved.push({
      ...activity,
      navigation,
    })
  }

  return resolved
}

export function resolveRecentActivity(
  updates: LaunchUpdate[],
  catalog: Launch[],
  storedActivities: StoredLaunchActivity[] = [],
  options: ResolveRecentActivityOptions = {},
): ResolvedRecentActivityItem[] {
  const isAdmin = options.isAdmin === true
  const pendingSubmissions = options.pendingSubmissions ?? []
  const activities = dedupeRecentActivities([
    ...buildUpdateActivities(updates, catalog),
    ...buildSubmissionActivities(catalog),
    ...(isAdmin
      ? buildPendingSubmissionActivities(pendingSubmissions, catalog)
      : []),
    ...buildLoggedActivities(storedActivities, catalog),
  ])

  return attachNavigation(activities, isAdmin).slice(0, RECENT_ACTIVITY_LIMIT)
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
