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
import { renderLaunchYourProjectSection } from '../components/launchYourProjectSection'
import { renderLatestUpdatesSection } from '../components/latestUpdatesSection'
import { renderRecentActivitySection } from '../components/recentActivitySection'
import {
  renderCbsToolsSection,
  renderFeaturedLaunchesSection,
  renderFooter,
  renderHeroSection,
  renderUpcomingLaunchesSection,
} from '../components/sections'
import { fetchLatestLaunchUpdates } from '../services/launchUpdatesService'
import { getAdminSessionToken } from '../services/adminSessionService'
import { fetchLaunchSubmissions } from '../services/listLaunchSubmissionsService'

/**
 * Compose and mount the CBS Token Launcher homepage.
 *
 * Each launch appears in one homepage section only.
 * Priority: Featured > Trending > New > Upcoming > Ecosystem (section assignment)
 */
export async function renderApp(): Promise<void> {
  const isAdmin = Boolean(getAdminSessionToken())
  const [catalog, latestUpdatesResult, submissionsResult] = await Promise.all([
    loadLaunchCatalog({ refresh: true }),
    fetchLatestLaunchUpdates(20),
    isAdmin
      ? fetchLaunchSubmissions()
      : Promise.resolve({ ok: false as const, message: '' }),
  ])
  const homepage = resolveHomepageSections(catalog)
  const renderedLaunches = getAllHomepageLaunches(homepage)
  const fetchedUpdates = latestUpdatesResult.ok ? latestUpdatesResult.updates : []
  const latestUpdates = fetchedUpdates.slice(0, 5)
  const pendingSubmissions =
    submissionsResult.ok === true
      ? submissionsResult.submissions.filter(
          (submission) => submission.status === 'pending',
        )
      : []

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <main class="app-shell" id="top">
      <img
        class="site-banner"
        src="${bannerUrl}"
        alt="CBS Token Launcher"
      />
      ${renderHeroSection()}
      ${renderLaunchFiltersPanel()}
      ${renderFeaturedLaunchesSection(homepage.featured)}
      ${renderRecentActivitySection(fetchedUpdates, catalog, {
        isAdmin,
        pendingSubmissions,
      })}
      ${renderLatestUpdatesSection(latestUpdates, catalog)}
      ${renderLaunchYourProjectSection()}
      ${renderLaunchPipelineSection()}
      ${renderUpcomingLaunchesSection(homepage.upcoming)}
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
