export const LAUNCH_SUBMISSION_STATUSES = [
  'pending',
  'coming_soon',
  'live',
  'rejected',
] as const

export type LaunchSubmissionStatus =
  (typeof LAUNCH_SUBMISSION_STATUSES)[number]

export function formatLaunchSubmissionStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'coming_soon':
      return 'Coming Soon'
    case 'live':
      return 'Live'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

export function getLaunchSubmissionStatusClass(status: string): string {
  const normalized = LAUNCH_SUBMISSION_STATUSES.includes(
    status as LaunchSubmissionStatus,
  )
    ? status
    : 'pending'

  return `admin-submissions-status admin-submissions-status--${normalized}`
}

export interface LaunchSubmissionStatusCounts {
  pending: number
  comingSoon: number
  live: number
  rejected: number
  total: number
}

export function countLaunchSubmissionStatuses(
  statuses: string[],
): LaunchSubmissionStatusCounts {
  const counts: LaunchSubmissionStatusCounts = {
    pending: 0,
    comingSoon: 0,
    live: 0,
    rejected: 0,
    total: statuses.length,
  }

  for (const status of statuses) {
    switch (status) {
      case 'pending':
        counts.pending += 1
        break
      case 'coming_soon':
        counts.comingSoon += 1
        break
      case 'live':
        counts.live += 1
        break
      case 'rejected':
        counts.rejected += 1
        break
      default:
        counts.pending += 1
        break
    }
  }

  return counts
}
