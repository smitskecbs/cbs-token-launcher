import bannerUrl from '../assets/launcher-banner.png'
import { cbsTools } from '../data/tools'
import { attachLaunchCardHandlers } from '../components/launchCardHandlers'
import { attachLaunchDataActions } from '../components/launchDataActions'
import { attachAppModals, renderAppModals } from '../components/appModals'
import {
  attachLaunchFilters,
  renderLaunchFiltersPanel,
} from '../components/launchFiltersPanel'
import { handleCatalogChange } from './handleCatalogChange'
import { loadLaunchCatalog } from '../services/launchService'
import {
  getAllHomepageLaunches,
  resolveHomepageSections,
} from '../services/homepageSectionsService'
import { renderLaunchPipelineSection } from '../components/launchPipelineSection'
import {
  attachMangoDonationSection,
  renderMangoDonationSection,
} from '../components/mangoDonationSection'
import {
  renderCbsEcosystemTokensSection,
  renderCbsToolsSection,
  renderFeaturedLaunchesSection,
  renderFooter,
  renderHeroSection,
  renderNewLaunchesSection,
  renderTrendingLaunchesSection,
  renderUpcomingLaunchesSection,
} from '../components/sections'

/**
 * Compose and mount the CBS Token Launcher homepage.
 *
 * Each launch appears in one homepage section only.
 * Priority: Featured > Trending > New > Upcoming > Ecosystem
 */
export async function renderApp(): Promise<void> {
  const catalog = await loadLaunchCatalog({ refresh: true })
  const homepage = resolveHomepageSections(catalog)
  const renderedLaunches = getAllHomepageLaunches(homepage)

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <main class="app-shell" id="top">
      <img
        class="site-banner"
        src="${bannerUrl}"
        alt="CBS Token Launcher"
      />

      ${renderHeroSection()}
      ${renderLaunchPipelineSection()}
      ${renderLaunchFiltersPanel()}
      ${renderFeaturedLaunchesSection(homepage.featured)}
      ${renderTrendingLaunchesSection(homepage.trending)}
      ${renderNewLaunchesSection(homepage.newLaunches)}
      ${renderUpcomingLaunchesSection(homepage.upcoming)}
      ${renderCbsEcosystemTokensSection(homepage.ecosystem)}
      ${renderCbsToolsSection(cbsTools)}
      ${renderMangoDonationSection()}
      ${renderFooter()}
    </main>
    ${renderAppModals()}
  `

  attachMangoDonationSection()
  attachLaunchCardHandlers(renderedLaunches)
  attachLaunchFilters(renderedLaunches, {
    initialCount: renderedLaunches.length,
  })
  attachAppModals(handleCatalogChange)
  attachLaunchDataActions(handleCatalogChange)
}

export function renderHomepageLoadingState(): void {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <main class="app-shell" id="top">
      <p class="hero-text homepage-loading-state">Loading launches…</p>
    </main>
  `
}
