import type { Launch } from '../types/launch'
import type {
  RecentActivityItem,
  RecentActivityNavigation,
} from '../types/recentActivity'
import {
  getAdminSubmissionPath,
  getTokenDetailPath,
} from '../router'

const SUBMISSION_PREFIX = 'submission-'

export function getSubmissionIdFromLaunchId(launchId: string): string | null {
  if (!launchId.startsWith(SUBMISSION_PREFIX)) {
    return null
  }

  const submissionId = launchId.slice(SUBMISSION_PREFIX.length).trim()

  return submissionId || null
}

/** Whether the launch has a public token detail page visitors can open. */
export function hasPublicLaunchDetailPage(launch: Launch): boolean {
  if (!launch.id.startsWith(SUBMISSION_PREFIX)) {
    return true
  }

  const launchStatus = launch.launchInfo?.launchStatus?.trim()

  return (
    launch.status === 'live' ||
    launchStatus === 'Live' ||
    launchStatus === 'Coming Soon'
  )
}

export function resolveRecentActivityNavigation(
  activity: RecentActivityItem,
  isAdmin: boolean,
): RecentActivityNavigation | null {
  if (hasPublicLaunchDetailPage(activity.launch)) {
    return {
      label: 'View Details',
      href: getTokenDetailPath(activity.launch.id),
    }
  }

  const submissionId = getSubmissionIdFromLaunchId(activity.launch.id)

  if (isAdmin && submissionId) {
    return {
      label: 'View Submission',
      href: getAdminSubmissionPath(submissionId),
    }
  }

  return null
}
