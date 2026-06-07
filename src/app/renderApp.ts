import bannerUrl from '../assets/launcher-banner.png'
import { attachLaunchCardHandlers } from '../components/launchCardHandlers'
import { attachAppModals, renderAppModals } from '../components/appModals'
import {
  attachLaunchFilters,
  renderLaunchFiltersPanel,
} from '../components/launchFiltersPanel'
import { handleCatalogChange } from './handleCatalogChange'
import { loadLaunchCatalog } from '../services/launchService'
import { resolveHomepageSections } from '../services/homepageSectionsService'
import { getHomepageVisibleLaunches } from '../services/homepageVisibleLaunchesService'
import { renderLaunchPipelineSection } from '../components/launchPipelineSection'
import {
  attachMangoDonationSection,
  renderMangoDonationSection,
} from '../components/mangoDonationSection'
import {
  renderLaunchYourProjectCta,
  renderLaunchYourProjectSection,
} from '../components/launchYourProjectSection'
import { renderLatestUpdatesSection } from '../components/latestUpdatesSection'
import { renderRecentActivitySection } from '../components/recentActivitySection'
import {
  renderFeaturedLaunchesSection,
  renderFooter,
  renderHeroSection,
  renderListedLaunchesSection,
  renderUpcomingLaunchesSection,
} from '../components/sections'
import { fetchLatestLaunchUpdates } from '../services/launchUpdatesService'
import { getAdminSessionToken } from '../services/adminSessionService'
import { fetchLaunchSubmissions } from '../services/listLaunchSubmissionsService'

/**
 * Compose and mount the CBS Token Launcher homepage.
 *
 * Each launch appears in one homepage section only.
 * Priority: Featured > Listed (live) > Upcoming (coming soon) > Trending > New > Ecosystem
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
  const fetchedUpdates = latestUpdatesResult.ok ? latestUpdatesResult.updates : []
  const latestUpdates = fetchedUpdates.slice(0, 10)
  const recentActivityOptions = {
    isAdmin,
    pendingSubmissions:
      submissionsResult.ok === true
        ? submissionsResult.submissions.filter(
            (submission) => submission.status === 'pending',
          )
        : [],
  }
  const homepageVisibleLaunches = getHomepageVisibleLaunches(
    catalog,
    homepage,
    latestUpdates,
    fetchedUpdates,
    recentActivityOptions,
  )
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
      ${renderListedLaunchesSection(homepage.listed)}
      ${renderRecentActivitySection(fetchedUpdates, catalog, recentActivityOptions)}
      ${renderLatestUpdatesSection(latestUpdates, catalog)}
      ${renderLaunchYourProjectSection()}
      ${renderLaunchPipelineSection()}
      ${renderLaunchYourProjectCta()}
      ${renderUpcomingLaunchesSection(homepage.upcoming)}
      ${renderMangoDonationSection()}
      ${renderFooter()}
    </main>
    ${renderAppModals()}
  `

  attachMangoDonationSection()
  attachLaunchCardHandlers(homepageVisibleLaunches)
  attachLaunchFilters(homepageVisibleLaunches, {
    initialCount: homepageVisibleLaunches.length,
  })
  attachAppModals(handleCatalogChange)
}

export function renderHomepageLoadingState(): void {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <main class="app-shell" id="top">
      <p class="hero-text homepage-loading-state">Loading launches…</p>
    </main>
  `
}
