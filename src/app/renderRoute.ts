import type { AppRoute } from '../router'
import { renderApp, renderHomepageLoadingState } from './renderApp'
import { handleCatalogChange } from './handleCatalogChange'
import { attachAppModals, renderAppModals } from '../components/appModals'
import {
  attachAdminSubmissionsPage,
  renderAdminSubmissionsPage,
} from './renderAdminSubmissionsPage'
import {
  attachTokenDetailHandlers,
  renderTokenDetailPage,
} from './renderTokenDetailPage'
import { getLaunchById, loadLaunchCatalog } from '../services/launchService'
import {
  beginTokenDetailRoute,
  clearTokenDetailRoute,
} from '../services/launchPageViewTracking'

export function renderRoute(route: AppRoute): void {
  const app = document.querySelector<HTMLDivElement>('#app')

  if (!app) {
    return
  }

  if (route.name === 'home') {
    clearTokenDetailRoute()
    document.title = 'CBS Token Launcher'
    renderHomepageLoadingState()
    void renderApp().then(() => {
      window.scrollTo(0, 0)
    })
    return
  }

  if (route.name === 'admin-submissions') {
    clearTokenDetailRoute()
    document.title = 'Launch Submissions — CBS Token Launcher'
    app.innerHTML = renderAdminSubmissionsPage()
    attachAdminSubmissionsPage()
    window.scrollTo(0, 0)
    return
  }

  void renderTokenRoute(route.tokenId)
}

async function renderTokenRoute(tokenId: string): Promise<void> {
  beginTokenDetailRoute(tokenId)

  if (tokenId.startsWith('submission-') && !getLaunchById(tokenId)) {
    await loadLaunchCatalog({ refresh: true })
  }

  const app = document.querySelector<HTMLDivElement>('#app')

  if (!app) {
    return
  }

  app.innerHTML = renderTokenDetailPage(tokenId) + renderAppModals()

  const launch = getLaunchById(tokenId)

  if (launch) {
    attachTokenDetailHandlers(launch)
  }

  attachAppModals(handleCatalogChange)
  window.scrollTo(0, 0)
}
