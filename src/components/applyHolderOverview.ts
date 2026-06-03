import type { Launch } from '../types/launch'
import type { HolderOverviewResult } from '../types/holderOverview'
import {
  applyHolderOverview,
  setHolderOverviewChecking,
} from './holderOverviewPanel'

export function applyLaunchHolderOverview(
  launch: Launch,
  result: HolderOverviewResult,
): void {
  applyHolderOverview(launch.id, result)
}

export function setLaunchHolderOverviewChecking(launch: Launch): void {
  setHolderOverviewChecking(launch.id)
}
