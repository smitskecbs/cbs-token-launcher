import type { Launch } from '../types/launch'
import { getLaunchDetailStatusLabel } from './launchDetailDisplay'

export function isLaunchLiveForBuy(launch: Launch): boolean {
  return getLaunchDetailStatusLabel(launch) === 'Live'
}

export function getLaunchBuyUrl(launch: Launch): string | null {
  const buyUrl = launch.buyUrl?.trim()

  return buyUrl || null
}
