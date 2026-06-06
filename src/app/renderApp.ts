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
  attachLauncherStatisticsSection,
  renderLauncherStatisticsSection,
} from '../components/launcherStatisticsSection'
import { renderLaunchYourProjectSection } from '../components/launchYourProjectSection'
import { renderLatestUpdatesSection } from '../components/latestUpdatesSection'
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
import { fetchLatestLaunchUpdates } from '../services/launchUpdatesService'

/**
 * Compose and mount the CBS Token Launcher homepage.
 *
 * Each launch appears in one homepage section only.
 * Priority: Featured > Trending > New > Upcoming > Ecosystem
 */
export async function renderApp(): Promise<void> {
  const [catalog, latestUpdatesResult] = await Promise.all([
    loadLaunchCatalog({ refresh: true }),
    fetchLatestLaunchUpdates(5),
  ])
  const homepage = resolveHomepageSections(catalog)
  const renderedLaunches = getAllHomepageLaunches(homepage)
  const latestUpdates = latestUpdatesResult.ok ? latestUpdatesResult.updates : []

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <main class="app-shell" id="top">
      <img
        class="site-banner"
        src="${bannerUrl}"
        alt="CBS Token Launcher"
      />

      ${renderHeroSection()}
      ${renderLauncherStatisticsSection(catalog)}
      ${renderLaunchYourProjectSection()}
      ${renderLaunchPipelineSection()}
      ${renderLaunchFiltersPanel()}
      ${renderFeaturedLaunchesSection(homepage.featured)}
      ${renderTrendingLaunchesSection(homepage.trending)}
      ${renderLatestUpdatesSection(latestUpdates, catalog)}
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
  attachLauncherStatisticsSection()
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
