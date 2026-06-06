import type { Launch } from '../types/launch'
import { getTokenDetailPath, navigate } from '../router'
import { getCachedMintVerification } from '../services/mintVerificationCache'
import {
  loadMintVerification,
  shouldAutoLoadMetadata,
} from '../services/mintVerificationService'
import { applyLaunchCardFromResult } from './applyLaunchCardMetadata'
import { applyLaunchCardMetadataSummary } from './launchCardMetadataSummary'

/**
 * Wire card navigation and lightweight cached metadata for homepage discovery cards.
 */
export function attachLaunchCardHandlers(
  catalog: Launch[],
): void {
  for (const launch of catalog) {
    attachLaunchCardNavigation(launch)
    restoreCachedLaunchCardData(launch)

    if (
      shouldAutoLoadMetadata(launch) &&
      !getCachedMintVerification(launch.mintAddress)
    ) {
      void loadDiscoveryCardMetadata(launch)
    }
  }
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
