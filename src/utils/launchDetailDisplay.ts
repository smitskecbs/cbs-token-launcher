import type { Launch } from '../types/launch'

export type LaunchDetailStatusLabel = 'Coming Soon' | 'Live' | 'Ended'

export function getLaunchDetailStatusLabel(launch: Launch): LaunchDetailStatusLabel {
  const launchStatus = launch.launchInfo?.launchStatus?.trim()

  if (launch.status === 'ended') {
    return 'Ended'
  }

  if (launch.status === 'live' || launchStatus === 'Live') {
    return 'Live'
  }

  return 'Coming Soon'
}

export function getLaunchDetailStatusClass(
  label: LaunchDetailStatusLabel,
): string {
  switch (label) {
    case 'Live':
      return 'token-detail-status-badge--live'
    case 'Ended':
      return 'token-detail-status-badge--ended'
    default:
      return 'token-detail-status-badge--coming-soon'
  }
}

export function getDetailPageName(launch: Launch): string {
  return launch.name?.trim() || 'Unnamed project'
}

export function getDetailPageSymbol(launch: Launch): string {
  return launch.symbol?.trim() || '—'
}

export function getDetailPageDescription(launch: Launch): string {
  return (
    launch.description?.trim() ||
    'No project description provided yet.'
  )
}

export function getLaunchListedDateLabel(launch: Launch): string | null {
  const timestamp = launch.submittedAt ?? launch.createdAt

  if (!timestamp || timestamp <= 0) {
    return null
  }

  const parsed = new Date(timestamp)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toLocaleDateString('en-US', {
    dateStyle: 'medium',
  })
}
