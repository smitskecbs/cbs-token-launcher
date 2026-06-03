import bannerUrl from '../assets/launcher-banner.png'
import { cbsTools } from '../data/tools'
import { attachLaunchCardHandlers } from '../components/launchCardHandlers'
import { attachLaunchDataActions } from '../components/launchDataActions'
import { attachAppModals, renderAppModals } from '../components/appModals'
import { handleCatalogChange } from './handleCatalogChange'
import {
  getEcosystemTokens,
  getFeaturedLaunches,
  getLaunchCatalog,
  getUpcomingLaunches,
} from '../services/launchService'
import {
  renderCbsEcosystemTokensSection,
  renderCbsToolsSection,
  renderFeaturedLaunchesSection,
  renderFooter,
  renderHeroSection,
  renderUpcomingLaunchesSection,
} from '../components/sections'

/**
 * Compose and mount the CBS Token Launcher homepage.
 *
 * Data flow:
 *   data/launches.ts → launchService (filter by status) → launch cards → DOM
 *
 * Every launch card is rendered from the `launches` catalog — add or remove
 * entries in data/launches.ts without changing page structure.
 *
 * Future Phase: call enrichAllLaunches(launches) before render to merge
 * on-chain metadata and market data into each card.
 * Category filtering: applyCategoryFilter() + categoryService helpers.
 */
export function renderApp(): void {
  const catalog = getLaunchCatalog()
  const featuredLaunches = getFeaturedLaunches(catalog)
  const ecosystemTokens = getEcosystemTokens(catalog)
  const upcomingLaunches = getUpcomingLaunches(catalog)
  const renderedLaunches = [
    ...featuredLaunches,
    ...ecosystemTokens,
    ...upcomingLaunches,
  ]

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <main class="app-shell" id="top">
      <img
        class="site-banner"
        src="${bannerUrl}"
        alt="CBS Token Launcher"
      />

      ${renderHeroSection()}
      ${renderFeaturedLaunchesSection(featuredLaunches)}
      ${renderCbsEcosystemTokensSection(ecosystemTokens)}
      ${renderUpcomingLaunchesSection(upcomingLaunches)}
      ${renderCbsToolsSection(cbsTools)}
      ${renderFooter()}
    </main>
    ${renderAppModals()}
  `

  attachLaunchCardHandlers(renderedLaunches)
  attachAppModals(handleCatalogChange)
  attachLaunchDataActions(handleCatalogChange)
}
