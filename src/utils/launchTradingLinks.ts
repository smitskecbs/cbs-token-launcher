import type { Launch } from '../types/launch'
import { getRaydiumPoolCreationUrl, getRaydiumSwapUrl } from '../config/urls'

function trimUrl(value: string | undefined): string | null {
  const trimmed = value?.trim()

  return trimmed || null
}

export function getLaunchPoolUrl(launch: Launch): string | null {
  return trimUrl(launch.poolUrl)
}

export function getLaunchRaydiumTradeUrl(launch: Launch): string | null {
  const configuredUrl = trimUrl(launch.raydiumUrl)

  if (configuredUrl) {
    return configuredUrl
  }

  if (getLaunchPoolUrl(launch)) {
    return getRaydiumSwapUrl(launch.mintAddress)
  }

  return null
}

export function getLaunchJupiterTradeUrl(launch: Launch): string | null {
  return trimUrl(launch.jupiterUrl)
}

export function getLaunchRaydiumPoolCreationLink(): string {
  return getRaydiumPoolCreationUrl()
}

export function hasLaunchPoolUrl(launch: Launch): boolean {
  return getLaunchPoolUrl(launch) !== null
}
