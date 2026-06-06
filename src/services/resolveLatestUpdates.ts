import type { Launch } from '../types/launch'
import type { LaunchUpdate } from '../types/launchUpdate'
import { getSubmissionLaunchId } from './mapSubmissionToLaunch'

export interface ResolvedLatestUpdate {
  update: LaunchUpdate
  launch: Launch
}

function resolveLaunchIdFromUpdate(update: LaunchUpdate): string | null {
  if (update.launchId) {
    return update.launchId
  }

  if (update.submissionId) {
    return getSubmissionLaunchId(update.submissionId)
  }

  return null
}

export function resolveLatestUpdates(
  updates: LaunchUpdate[],
  catalog: Launch[],
): ResolvedLatestUpdate[] {
  const launchesById = new Map(catalog.map((launch) => [launch.id, launch]))
  const resolved: ResolvedLatestUpdate[] = []

  for (const update of updates) {
    const launchId = resolveLaunchIdFromUpdate(update)

    if (!launchId) {
      continue
    }

    const launch = launchesById.get(launchId)

    if (!launch) {
      continue
    }

    resolved.push({ update, launch })
  }

  return resolved
}
