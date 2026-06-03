export type AppRoute =
  | { name: 'home' }
  | { name: 'token'; tokenId: string }

export function getTokenDetailPath(tokenId: string): string {
  return `/token/${encodeURIComponent(tokenId)}`
}

export function parseRoute(pathname: string): AppRoute {
  const tokenMatch = pathname.match(/^\/token\/([^/]+)\/?$/)

  if (tokenMatch) {
    return {
      name: 'token',
      tokenId: decodeURIComponent(tokenMatch[1]),
    }
  }

  return { name: 'home' }
}

export function getCurrentRoute(): AppRoute {
  return parseRoute(window.location.pathname)
}

type RouteListener = (route: AppRoute) => void

let routeListener: RouteListener | null = null

export function navigate(path: string): void {
  const url = new URL(path, window.location.origin)

  if (
    url.origin === window.location.origin &&
    url.pathname + url.search + url.hash !==
      window.location.pathname +
        window.location.search +
        window.location.hash
  ) {
    window.history.pushState(null, '', url.pathname + url.search + url.hash)
    routeListener?.(parseRoute(url.pathname))
  }
}

export function initRouter(onRouteChange: RouteListener): void {
  routeListener = onRouteChange

  window.addEventListener('popstate', () => {
    routeListener?.(getCurrentRoute())
  })

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const link = target.closest<HTMLAnchorElement>('a[data-router-link]')

    if (!link || link.origin !== window.location.origin) {
      return
    }

    event.preventDefault()
    navigate(link.pathname + link.search + link.hash)
  })

  onRouteChange(getCurrentRoute())
}
