import type { AppRoute } from '../router'
import { renderApp } from './renderApp'
import { handleCatalogChange } from './handleCatalogChange'
import { attachAppModals, renderAppModals } from '../components/appModals'
import {
  attachTokenDetailHandlers,
  renderTokenDetailPage,
} from './renderTokenDetailPage'
import { getLaunchById } from '../services/launchService'

export function renderRoute(route: AppRoute): void {
  const app = document.querySelector<HTMLDivElement>('#app')

  if (!app) {
    return
  }

  if (route.name === 'home') {
    document.title = 'CBS Token Launcher'
    renderApp()
    window.scrollTo(0, 0)
    return
  }

  app.innerHTML = renderTokenDetailPage(route.tokenId) + renderAppModals()

  const launch = getLaunchById(route.tokenId)

  if (launch) {
    attachTokenDetailHandlers(launch)
  }

  attachAppModals(handleCatalogChange)
  window.scrollTo(0, 0)
}
