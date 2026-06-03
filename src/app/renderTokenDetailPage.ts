import bannerUrl from '../assets/launcher-banner.png'
import type { Launch } from '../types/launch'
import { getSolscanTokenUrl } from '../config/urls'
import {
  getEcosystemTokens,
  getFeaturedLaunches,
  getLaunchById,
  getUpcomingLaunches,
} from '../services/launchService'
import { getLaunchDisplayName } from '../components/applyLaunchCardMetadata'
import { escapeHtml } from '../utils/html'
import { renderFooter } from '../components/sections'
import { renderLaunchAdminActions } from '../components/launchAdminActions'
import { renderTokenDetailSections } from '../components/tokenDetailSections'
import { getLaunchRankInSection, getLaunchRankScore } from '../services/launchRankingService'
import {
  categoryToFilterSlug,
  DEFAULT_METADATA_CATEGORY,
} from '../utils/metadataCategory'
import {
  applyTokenDetailFromResult,
  setTokenDetailLoading,
} from '../components/applyTokenDetailMetadata'
import {
  applyMarketStatus,
  setMarketStatusChecking,
} from '../components/applyMarketStatus'
import { loadMintVerification } from '../services/mintVerificationService'
import { loadMarketStatus } from '../services/marketStatusService'
import { getCachedMintVerification } from '../services/mintVerificationCache'
import { getCachedMarketStatus } from '../services/marketStatusCache'

function getSectionLaunchesForRank(launch: Launch) {
  if (launch.section === 'featured') {
    return getFeaturedLaunches()
  }

  if (launch.section === 'upcoming') {
    return getUpcomingLaunches()
  }

  return getEcosystemTokens()
}

function renderNotFound(tokenId: string): string {
  return `
    <main class="app-shell" id="top">
      <img
        class="site-banner"
        src="${bannerUrl}"
        alt="CBS Token Launcher"
      />

      <a class="back-link" href="/" data-router-link>← Back to launcher</a>

      <section class="token-detail-card launch-card">
        <h1>Token not found</h1>
        <p class="hero-text">
          No token with id "${escapeHtml(tokenId)}" exists in the launch catalog.
        </p>
        <div class="actions">
          <a class="primary-btn" href="/" data-router-link>
            Return home
          </a>
        </div>
      </section>

      ${renderFooter()}
    </main>
  `
}

function renderTokenDetailCard(launch: Launch): string {
  const id = escapeHtml(launch.id)
  const solscanUrl = escapeHtml(getSolscanTokenUrl(launch.mintAddress))
  const score = getLaunchRankScore(launch)
  const sectionRank = getLaunchRankInSection(
    launch,
    getSectionLaunchesForRank(launch),
  )

  return `
    <article
      class="token-detail-card launch-card"
      data-token-detail="${id}"
      data-launch-rank-score="${score ?? 0}"
      data-token-category-slug="${escapeHtml(categoryToFilterSlug(DEFAULT_METADATA_CATEGORY))}"
    >
      ${renderTokenDetailSections(launch, sectionRank)}

      <div class="token-detail-actions actions">
        <a
          class="primary-btn"
          href="${solscanUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Solscan
        </a>
        <button
          type="button"
          class="secondary-btn"
          data-refresh-token-detail="${id}"
        >
          Refresh metadata
        </button>
      </div>

      ${renderLaunchAdminActions(launch)}
    </article>
  `
}

export function renderTokenDetailPage(tokenId: string): string {
  const launch = getLaunchById(tokenId)

  if (!launch) {
    document.title = 'Token not found — CBS Token Launcher'
    return renderNotFound(tokenId)
  }

  document.title = `${getLaunchDisplayName(launch)} — CBS Token Launcher`

  return `
    <main class="app-shell" id="top">
      <img
        class="site-banner"
        src="${bannerUrl}"
        alt="CBS Token Launcher"
      />

      <a class="back-link" href="/" data-router-link>← Back to launcher</a>

      ${renderTokenDetailCard(launch)}

      ${renderFooter()}
    </main>
  `
}

export function attachTokenDetailHandlers(launch: Launch): void {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    `[data-refresh-token-detail="${launch.id}"]`,
  )

  refreshButton?.addEventListener('click', () => {
    void loadTokenDetailData(launch, { forceRefresh: true })
  })

  void loadTokenDetailData(launch)
}

async function loadTokenDetailData(
  launch: Launch,
  options: { forceRefresh?: boolean } = {},
): Promise<void> {
  await Promise.all([
    loadTokenDetailMetadata(launch, options),
    loadTokenDetailMarketStatus(launch, options),
  ])
}

async function loadTokenDetailMarketStatus(
  launch: Launch,
  options: { forceRefresh?: boolean } = {},
): Promise<void> {
  if (!options.forceRefresh) {
    const cached = getCachedMarketStatus(launch.mintAddress)

    if (cached) {
      applyMarketStatus(launch, cached)
      return
    }
  }

  setMarketStatusChecking(launch)

  const result = await loadMarketStatus(launch.mintAddress, options)
  applyMarketStatus(launch, result)
}

async function loadTokenDetailMetadata(
  launch: Launch,
  options: { forceRefresh?: boolean } = {},
): Promise<void> {
  const refreshButton = document.querySelector<HTMLButtonElement>(
    `[data-refresh-token-detail="${launch.id}"]`,
  )

  if (!options.forceRefresh) {
    const cached = getCachedMintVerification(launch.mintAddress)

    if (cached) {
      applyTokenDetailFromResult(launch, cached)
      return
    }

    setTokenDetailLoading(launch)
  }

  if (refreshButton) {
    refreshButton.disabled = true
  }

  try {
    const result = await loadMintVerification(launch.mintAddress, options)
    applyTokenDetailFromResult(launch, result)
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false
    }
  }
}
