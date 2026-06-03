import type { Launch } from '../types/launch'
import { getTokenDetailPath, navigate } from '../router'
import { getLaunchById } from '../services/launchService'
import {
  clearCachedMintVerification,
  getCachedMintVerification,
} from '../services/mintVerificationCache'
import {
  getCachedMarketStatus,
} from '../services/marketStatusCache'
import {
  loadMintVerification,
  shouldAutoLoadMetadata,
} from '../services/mintVerificationService'
import { loadMarketStatus } from '../services/marketStatusService'
import { applyLaunchCardFromResult } from './applyLaunchCardMetadata'
import {
  applyMarketStatus,
  setMarketStatusChecking,
} from './applyMarketStatus'
import {
  showVerifyChecking,
  showVerifyResult,
  toggleVerifyPanelExpanded,
  verifyPanelId,
} from './mintVerificationPanel'
import {
  metadataAccordionId,
  openLaunchAccordion,
} from './launchCardAccordion'

let launchCardAppClickHandlerAttached = false

/**
 * Wire Verify Mint buttons, card navigation, and cached metadata on launch cards.
 */
export function attachLaunchCardHandlers(
  catalog: Launch[],
): void {
  for (const launch of catalog) {
    attachLaunchCardNavigation(launch)

    if (shouldAutoLoadMetadata(launch)) {
      void loadAutoLaunchCardData(launch)
    } else {
      restoreCachedLaunchCardData(launch)
    }

    const button = document.querySelector<HTMLButtonElement>(
      `[data-verify-mint="${launch.id}"]`,
    )

    if (!button) {
      continue
    }

    button.addEventListener('click', () => {
      void handleVerifyMint(launch, button)
    })
  }

  if (!launchCardAppClickHandlerAttached) {
    document.querySelector('#app')?.addEventListener(
      'click',
      handleLaunchCardAppClick,
    )
    launchCardAppClickHandlerAttached = true
  }
}

function handleLaunchCardAppClick(event: Event): void {
  const target = event.target as HTMLElement
  const infoButton = target.closest<HTMLButtonElement>(
    '[data-technical-risk-info]',
  )

  if (infoButton) {
    event.preventDefault()
    event.stopPropagation()

    const card = infoButton.closest<HTMLElement>('[data-token-card]')
    const notice = card?.querySelector<HTMLElement>(
      '[data-technical-risk-notice]',
    )

    if (notice) {
      notice.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      notice.classList.add('technical-risk-notice--highlight')

      window.setTimeout(() => {
        notice.classList.remove('technical-risk-notice--highlight')
      }, 1600)
    }

    return
  }

  const openAccordionButton = target.closest<HTMLButtonElement>(
    '[data-open-accordion]',
  )

  if (openAccordionButton) {
    event.preventDefault()
    event.stopPropagation()

    const accordionId = openAccordionButton.getAttribute('data-open-accordion')

    if (accordionId) {
      openLaunchAccordion(accordionId)
    }

    return
  }

  const expandButton = target.closest<HTMLButtonElement>(
    '[data-verify-expand]',
  )

  if (expandButton) {
    const panel = expandButton.closest<HTMLElement>('.verify-panel')

    if (panel) {
      toggleVerifyPanelExpanded(panel, expandButton)
    }

    return
  }

  const refreshButton = target.closest<HTMLButtonElement>(
    '[data-refresh-verify]',
  )

  if (!refreshButton) {
    return
  }

  const launchId = refreshButton.getAttribute('data-refresh-verify')

  if (!launchId) {
    return
  }

  const launch = getLaunchById(launchId)

  if (!launch) {
    return
  }

  const verifyButton = document.querySelector<HTMLButtonElement>(
    `[data-verify-mint="${launchId}"]`,
  )

  if (!verifyButton) {
    return
  }

  void handleVerifyMint(launch, verifyButton, { forceRefresh: true })
}

function attachLaunchCardNavigation(launch: Launch): void {
  const card = document.querySelector<HTMLElement>(
    `[data-token-card="${launch.id}"]`,
  )

  if (!card) {
    return
  }

  const openDetail = () => {
    navigate(getTokenDetailPath(launch.id))
  }

  card.addEventListener('click', (event) => {
    const target = event.target as HTMLElement

    if (target.closest('a, button, summary, .launch-card-accordions, .launch-manage-menu')) {
      return
    }

    openDetail()
  })

  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    openDetail()
  })
}

interface VerifyMintOptions {
  forceRefresh?: boolean
}

/** Restore cached metadata and market data without network calls */
function restoreCachedLaunchCardData(launch: Launch): void {
  const cached = getCachedMintVerification(launch.mintAddress)

  if (cached?.exists) {
    applyLaunchCardFromResult(launch, cached)

    const panel = document.getElementById(verifyPanelId(launch.id))

    if (panel) {
      showVerifyResult(panel, cached, {
        fromCache: true,
        launchId: launch.id,
      })
    }
  }

  const cachedMarket = getCachedMarketStatus(launch.mintAddress)

  if (cachedMarket) {
    applyMarketStatus(launch, cachedMarket)
  }
}

/** Auto-load metadata and market status in parallel (each layer uses its own cache) */
async function loadAutoLaunchCardData(
  launch: Launch,
  options: VerifyMintOptions = {},
): Promise<void> {
  await Promise.all([
    runMintVerification(launch, options),
    runMarketStatusCheck(launch, options),
  ])
}

function showVerificationResult(
  launch: Launch,
  panel: HTMLElement,
  result: Awaited<ReturnType<typeof loadMintVerification>>,
  fromCache: boolean,
): void {
  showVerifyResult(panel, result, {
    fromCache,
    launchId: launch.id,
  })
  applyLaunchCardFromResult(launch, result)
  openLaunchAccordion(metadataAccordionId(launch.id))
}

async function runMintVerification(
  launch: Launch,
  options: VerifyMintOptions = {},
): Promise<void> {
  const panel = document.getElementById(verifyPanelId(launch.id))

  if (!panel) {
    return
  }

  if (!options.forceRefresh) {
    const cached = getCachedMintVerification(launch.mintAddress)

    if (cached) {
      showVerificationResult(launch, panel, cached, true)
      return
    }
  } else {
    clearCachedMintVerification(launch.mintAddress)
  }

  showVerifyChecking(panel)

  const result = await loadMintVerification(launch.mintAddress, options)
  showVerificationResult(launch, panel, result, false)
}

async function runMarketStatusCheck(
  launch: Launch,
  options: VerifyMintOptions = {},
): Promise<void> {
  if (!options.forceRefresh && getCachedMarketStatus(launch.mintAddress)) {
    applyMarketStatus(
      launch,
      getCachedMarketStatus(launch.mintAddress)!,
    )
    return
  }

  setMarketStatusChecking(launch)

  const result = await loadMarketStatus(launch.mintAddress, options)
  applyMarketStatus(launch, result)
}

async function handleVerifyMint(
  launch: Launch,
  button: HTMLButtonElement,
  options: VerifyMintOptions = {},
): Promise<void> {
  button.disabled = true

  try {
    await loadAutoLaunchCardData(launch, options)
  } finally {
    button.disabled = false
  }
}
