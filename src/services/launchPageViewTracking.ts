let activeTokenRouteId: string | null = null
let pageViewTrackedForActiveRoute = false

export function beginTokenDetailRoute(tokenId: string): void {
  const trimmedTokenId = tokenId.trim()

  if (!trimmedTokenId) {
    return
  }

  if (activeTokenRouteId !== trimmedTokenId) {
    activeTokenRouteId = trimmedTokenId
    pageViewTrackedForActiveRoute = false
  }
}

export function shouldTrackLaunchPageView(launchId: string): boolean {
  const trimmedLaunchId = launchId.trim()

  if (!trimmedLaunchId || activeTokenRouteId !== trimmedLaunchId) {
    return false
  }

  if (pageViewTrackedForActiveRoute) {
    return false
  }

  pageViewTrackedForActiveRoute = true
  return true
}

export function clearTokenDetailRoute(): void {
  activeTokenRouteId = null
  pageViewTrackedForActiveRoute = false
}
