import type { Launch } from '../types/launch'
import { getTokenDetailPath, navigate } from '../router'
import { getCachedMintVerification } from '../services/mintVerificationCache'
import {
  loadMintVerification,
  shouldAutoLoadMetadata,
} from '../services/mintVerificationService'
import { fetchTokenMarketData } from '../services/tokenMarketDataService'
import { getCachedTokenMarketData } from '../services/tokenMarketDataCache'
import { isLaunchLiveForBuy } from '../utils/launchBuyLink'
import { applyLaunchCardFromResult } from './applyLaunchCardMetadata'
import { applyLaunchCardMetadataSummary } from './launchCardMetadataSummary'
import {
  applyLaunchDiscoveryCardMarketData,
  setLaunchDiscoveryCardMarketLoading,
} from './launchDiscoveryCardStats'
import { attachLaunchInterestControl } from './launchInterestControl'
import {
  getLaunchCardInstanceIds,
  getSearchResultLaunchCardInstanceId,
} from './launchCard'

const pendingDiscoveryMetadataLoads = new Map<string, Promise<void>>()
const pendingDiscoveryMarketLoads = new Map<string, Promise<void>>()

/**
 * Wire card navigation and lightweight cached metadata for homepage discovery cards.
 */
export function attachLaunchCardHandlers(
  catalog: Launch[],
): void {
  const seenLaunchIds = new Set<string>()

  for (const launch of catalog) {
    if (seenLaunchIds.has(launch.id)) {
      continue
    }

    seenLaunchIds.add(launch.id)
    attachLaunchCardHandlersForLaunch(launch)
  }
}

export function attachLaunchCardHandlersForLaunch(
  launch: Launch,
  options: { cardInstanceId?: string } = {},
): void {
  const cards = options.cardInstanceId
    ? getLaunchCardElementsByInstanceId(options.cardInstanceId)
    : getLaunchCardElements(launch.id)

  for (const card of cards) {
    wireLaunchCardNavigation(card, launch)
    attachLaunchInterestControl(launch, card)
  }

  restoreCachedLaunchCardMarketData(launch)
  restoreCachedLaunchCardData(launch)

  if (
    shouldAutoLoadMetadata(launch) &&
    !getCachedMintVerification(launch.mintAddress)
  ) {
    void loadDiscoveryCardMetadata(launch)
  }

  if (isLaunchLiveForBuy(launch)) {
    void loadDiscoveryCardMarketData(launch)
  }
}

function wireLaunchCardNavigation(
  card: HTMLElement,
  launch: Launch,
): void {
  const openDetail = () => {
    navigate(getTokenDetailPath(launch.id))
  }

  card.addEventListener('click', (event) => {
    const target = event.target as HTMLElement

    if (target.closest('a, button')) {
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

/** Hydrate a single inline search result card using shared discovery caches/loaders. */
export function hydrateLaunchSearchResultCard(launch: Launch): void {
  attachLaunchCardHandlersForLaunch(launch, {
    cardInstanceId: getSearchResultLaunchCardInstanceId(launch.id),
  })
}

/** @deprecated Use hydrateLaunchSearchResultCard */
export function attachLaunchSearchResultCardHandlers(launch: Launch): void {
  hydrateLaunchSearchResultCard(launch)
}

function getLaunchCardElements(launchId: string): HTMLElement[] {
  return getLaunchCardInstanceIds(launchId)
    .map((instanceId) => getLaunchCardElementByInstanceId(instanceId))
    .filter((card): card is HTMLElement => card != null)
}

function getLaunchCardElementsByInstanceId(
  cardInstanceId: string,
): HTMLElement[] {
  const card = getLaunchCardElementByInstanceId(cardInstanceId)

  return card ? [card] : []
}

function getLaunchCardElementByInstanceId(
  cardInstanceId: string,
): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `[data-token-card="${cardInstanceId}"]`,
  )
}

/** Restore cached metadata for card header fields without network calls */
function restoreCachedLaunchCardData(launch: Launch): void {
  const cached = getCachedMintVerification(launch.mintAddress)

  if (!cached) {
    return
  }

  applyLaunchCardMetadataSummary(launch, cached)

  if (cached.exists) {
    applyLaunchCardFromResult(launch, cached)
  }
}

/** Auto-load metadata only when catalog entries opt in (uses existing cache layer) */
async function loadDiscoveryCardMetadata(launch: Launch): Promise<void> {
  const mintAddress = launch.mintAddress.trim()
  const pending = pendingDiscoveryMetadataLoads.get(mintAddress)

  if (pending) {
    await pending
    const cached = getCachedMintVerification(mintAddress)

    if (cached) {
      applyLaunchCardFromResult(launch, cached)
    }

    return
  }

  const loadPromise = (async () => {
    const result = await loadMintVerification(mintAddress)
    applyLaunchCardFromResult(launch, result)
  })()

  pendingDiscoveryMetadataLoads.set(mintAddress, loadPromise)

  try {
    await loadPromise
  } finally {
    pendingDiscoveryMetadataLoads.delete(mintAddress)
  }
}

function restoreCachedLaunchCardMarketData(launch: Launch): void {
  const cached = getCachedTokenMarketData(launch.mintAddress)

  if (cached) {
    applyLaunchDiscoveryCardMarketData(launch, cached)
  }
}

async function loadDiscoveryCardMarketData(launch: Launch): Promise<void> {
  if (!isLaunchLiveForBuy(launch)) {
    return
  }

  const mintAddress = launch.mintAddress.trim()
  const cached = getCachedTokenMarketData(mintAddress)

  if (cached) {
    applyLaunchDiscoveryCardMarketData(launch, cached)
    return
  }

  const pending = pendingDiscoveryMarketLoads.get(mintAddress)

  if (pending) {
    await pending
    const resolved = getCachedTokenMarketData(mintAddress)

    if (resolved) {
      applyLaunchDiscoveryCardMarketData(launch, resolved)
    }

    return
  }

  setLaunchDiscoveryCardMarketLoading(launch)

  const loadPromise = (async () => {
    const result = await fetchTokenMarketData(mintAddress)

    if (!result.ok) {
      return
    }

    applyLaunchDiscoveryCardMarketData(launch, result.data)
  })()

  pendingDiscoveryMarketLoads.set(mintAddress, loadPromise)

  try {
    await loadPromise
  } finally {
    pendingDiscoveryMarketLoads.delete(mintAddress)
  }
}
