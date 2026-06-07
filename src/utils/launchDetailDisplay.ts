import type { Launch } from '../types/launch'
import {
  getLaunchDisplayDescription,
  getLaunchDisplayName,
  getLaunchDisplaySymbol,
} from '../components/applyLaunchCardMetadata'
import {
  LAUNCH_CARD_AUTO_LOAD_PLACEHOLDER,
  LAUNCH_CARD_PLACEHOLDER,
} from '../types/launch'

export type LaunchDetailStatusLabel = 'Coming Soon' | 'Live' | 'Ended'

export type DiscoveryCardStatusLabel =
  | 'Preparing'
  | 'Coming Soon'
  | 'Live'
  | 'Ended'

export type DiscoveryCardStatusBadgeId =
  | 'preparing'
  | 'upcoming'
  | 'live'
  | 'ended'

export function getDiscoveryCardStatusLabel(
  launch: Launch,
): DiscoveryCardStatusLabel {
  if (launch.status === 'ended') {
    return 'Ended'
  }

  if (launch.status === 'live' || launch.launchInfo?.launchStatus === 'Live') {
    return 'Live'
  }

  const launchStatus = launch.launchInfo?.launchStatus?.trim()

  if (launchStatus === 'Coming Soon') {
    return 'Coming Soon'
  }

  if (launch.status === 'preparing') {
    return 'Preparing'
  }

  return 'Coming Soon'
}

export function getDiscoveryCardStatusBadgeId(
  label: DiscoveryCardStatusLabel,
): DiscoveryCardStatusBadgeId {
  switch (label) {
    case 'Live':
      return 'live'
    case 'Preparing':
      return 'preparing'
    case 'Ended':
      return 'ended'
    default:
      return 'upcoming'
  }
}

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
  return getLaunchDisplayName(launch)
}

export function getDetailPageSymbol(launch: Launch): string {
  return getLaunchDisplaySymbol(launch)
}

export function getDetailPageDescription(launch: Launch): string {
  const display = getLaunchDisplayDescription(launch)

  if (
    display !== LAUNCH_CARD_PLACEHOLDER.description &&
    display !== LAUNCH_CARD_AUTO_LOAD_PLACEHOLDER.description
  ) {
    return display
  }

  return launch.description?.trim() || 'No project description provided yet.'
}

export function isCatalogSubmissionLaunch(launch: Launch): boolean {
  return launch.id.startsWith('submission-') || launch.locallyManaged === true
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

/** Detail-page listed line — hides static placeholder dates for Coming Soon launches */
export function getLaunchListedDateDisplay(launch: Launch): string | null {
  const status = getLaunchDetailStatusLabel(launch)
  const formattedDate = getLaunchListedDateLabel(launch)

  if (status === 'Coming Soon') {
    if (isCatalogSubmissionLaunch(launch) && formattedDate) {
      return `Listed ${formattedDate}`
    }

    return 'Listed: Coming Soon'
  }

  if (formattedDate) {
    return `Listed ${formattedDate}`
  }

  return null
}
