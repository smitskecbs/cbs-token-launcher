import bannerUrl from '../assets/launcher-banner.png'
import type { Launch } from '../types/launch'
import { getSolscanTokenUrl } from '../config/urls'
import { getLaunchById } from '../services/launchService'
import {
  attachTokenDetailProjectInfo,
} from '../components/tokenDetailProjectInfo'
import { attachTokenDetailLaunchUpdates } from '../components/tokenDetailLaunchUpdates'
import { attachLaunchInterestControl } from '../components/launchInterestControl'
import { getDetailPageName } from '../utils/launchDetailDisplay'
import { escapeHtml } from '../utils/html'
import { renderFooter } from '../components/sections'
import { renderTokenDetailBackNav } from '../components/tokenDetailBackNav'
import { renderLaunchAdminActions } from '../components/launchAdminActions'
import { renderTokenDetailBuySection } from '../components/tokenDetailBuySection'
import { renderTokenDetailPoolSection } from '../components/tokenDetailPoolSection'
import {
  renderTokenDetailAccordionSections,
  renderTokenDetailSections,
} from '../components/tokenDetailSections'
import { applyTokenDetailPoolSection } from '../components/tokenDetailPoolSection'
import {
  applyTokenDetailTradingData,
  renderTokenDetailTradingSection,
  setTokenDetailTradingError,
  setTokenDetailTradingLoading,
} from '../components/tokenDetailTradingSection'
import { isLaunchLiveForBuy } from '../utils/launchBuyLink'
import { fetchTokenMarketData } from '../services/tokenMarketDataService'
import { getCachedTokenMarketData } from '../services/tokenMarketDataCache'
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

function renderNotFound(tokenId: string): string {
  return `
    <main class="app-shell" id="top">
      <img
        class="site-banner"
        src="${bannerUrl}"
        alt="CBS Token Launcher"
      />

      ${renderTokenDetailBackNav()}

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

  return `
    <article
      class="token-detail-card launch-card"
      data-token-detail="${id}"
    >
      ${renderTokenDetailSections(launch)}

      ${renderTokenDetailPoolSection(launch)}

      ${renderTokenDetailTradingSection(launch)}

      ${renderTokenDetailBuySection(launch)}

      ${renderTokenDetailAccordionSections(launch)}

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

  document.title = `${getDetailPageName(launch)} — CBS Token Launcher`

  return `
    <main class="app-shell" id="top">
      <img
        class="site-banner"
        src="${bannerUrl}"
        alt="CBS Token Launcher"
      />

      ${renderTokenDetailBackNav()}

      ${renderTokenDetailCard(launch)}

      ${renderFooter()}
    </main>
  `
}

export function attachTokenDetailHandlers(launch: Launch): void {
  attachTokenDetailProjectInfo(launch)
  attachTokenDetailLaunchUpdates(launch)
  attachLaunchInterestControl(launch)

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
    loadTokenDetailTradingData(launch, options),
  ])
}

async function loadTokenDetailTradingData(
  launch: Launch,
  options: { forceRefresh?: boolean } = {},
): Promise<void> {
  const isLive = isLaunchLiveForBuy(launch)

  if (!options.forceRefresh) {
    const cached = getCachedTokenMarketData(launch.mintAddress)

    if (cached) {
      applyTokenDetailPoolSection(launch, cached)

      if (isLive) {
        applyTokenDetailTradingData(launch, cached)
      }

      return
    }
  }

  if (isLive) {
    setTokenDetailTradingLoading(launch)
  }

  const result = await fetchTokenMarketData(launch.mintAddress, options)

  if (!result.ok) {
    if (isLive) {
      setTokenDetailTradingError(launch, result.message)
    }

    return
  }

  applyTokenDetailPoolSection(launch, result.data)

  if (isLive) {
    applyTokenDetailTradingData(launch, result.data)
  }
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
