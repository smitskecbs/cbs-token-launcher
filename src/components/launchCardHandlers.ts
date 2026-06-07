import type { Launch } from '../types/launch'
import { getTokenDetailPath, navigate } from '../router'
import { getCachedMintVerification } from '../services/mintVerificationCache'
import {
  loadMintVerification,
  shouldAutoLoadMetadata,
} from '../services/mintVerificationService'
import { applyLaunchCardFromResult } from './applyLaunchCardMetadata'
import { applyLaunchCardMetadataSummary } from './launchCardMetadataSummary'
import { attachLaunchInterestControl } from './launchInterestControl'
import {
  getLaunchCardInstanceIds,
  getSearchResultLaunchCardInstanceId,
} from './launchCard'

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

export function attachLaunchCardHandlersForLaunch(launch: Launch): void {
  attachLaunchCardNavigation(launch)
  attachLaunchInterestControl(launch)
  restoreCachedLaunchCardData(launch)

  if (
    shouldAutoLoadMetadata(launch) &&
    !getCachedMintVerification(launch.mintAddress)
  ) {
    void loadDiscoveryCardMetadata(launch)
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

function attachLaunchCardNavigation(launch: Launch): void {
  for (const card of getLaunchCardElements(launch.id)) {
    wireLaunchCardNavigation(card, launch)
  }
}

export function attachLaunchSearchResultCardHandlers(launch: Launch): void {
  const card = document.querySelector<HTMLElement>(
    `[data-token-card="${getSearchResultLaunchCardInstanceId(launch.id)}"]`,
  )

  if (!card) {
    return
  }

  wireLaunchCardNavigation(card, launch)
  attachLaunchInterestControl(launch, card)
}

function getLaunchCardElements(launchId: string): HTMLElement[] {
  return getLaunchCardInstanceIds(launchId)
    .map((instanceId) =>
      document.querySelector<HTMLElement>(`[data-token-card="${instanceId}"]`),
    )
    .filter((card): card is HTMLElement => card != null)
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
  const result = await loadMintVerification(launch.mintAddress)
  applyLaunchCardFromResult(launch, result)
}
