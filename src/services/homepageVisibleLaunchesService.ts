import type { Launch } from '../types/launch'
import type { LaunchUpdate } from '../types/launchUpdate'
import {
  getAllHomepageLaunches,
  type ResolvedHomepageSections,
} from './homepageSectionsService'
import { readLaunchActivityLog } from './launchActivityLog'
import {
  resolveRecentActivity,
  type ResolveRecentActivityOptions,
} from './resolveRecentActivity'
import { resolveLatestUpdates } from './resolveLatestUpdates'

/** All launches that appear anywhere on the homepage (sections, activity, updates). */
export function getHomepageVisibleLaunches(
  catalog: Launch[],
  homepage: ResolvedHomepageSections,
  latestUpdates: LaunchUpdate[],
  fetchedUpdates: LaunchUpdate[],
  recentActivityOptions: ResolveRecentActivityOptions = {},
): Launch[] {
  const byId = new Map<string, Launch>()

  for (const launch of getAllHomepageLaunches(homepage)) {
    byId.set(launch.id, launch)
  }

  for (const { launch } of resolveLatestUpdates(latestUpdates, catalog)) {
    byId.set(launch.id, launch)
  }

  for (const activity of resolveRecentActivity(
    fetchedUpdates,
    catalog,
    readLaunchActivityLog(),
    recentActivityOptions,
  )) {
    byId.set(activity.launch.id, activity.launch)
  }

  return [...byId.values()]
}
