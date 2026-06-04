import type { Launch } from '../types/launch'
import {
  LAUNCH_CARD_AUTO_LOAD_PLACEHOLDER,
  LAUNCH_CARD_PLACEHOLDER,
} from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import { resolveMetadataImageUrl } from '../solana/fetchTokenMetadataJson'
import { applyOfficialLinksFromMetadata } from './officialLinks'
import { applyTokenCategory } from './tokenCategoryField'
import { applyTokenTags } from './tokenTagsField'
import { refreshLaunchAnalytics } from '../services/refreshLaunchAnalytics'
import { refreshLaunchRisk } from '../services/refreshLaunchRisk'
import {
  buildLaunchSearchText,
  getLaunchFilterCategorySlug,
} from '../services/launchFilterService'
import { getLaunchCatalog } from '../services/launchService'
import { reapplyLaunchFilters } from './launchFiltersPanel'

function getLaunchPlaceholder(launch: Launch) {
  return launch.autoLoadMetadata
    ? LAUNCH_CARD_AUTO_LOAD_PLACEHOLDER
    : LAUNCH_CARD_PLACEHOLDER
}

export function getLaunchDisplayName(launch: Launch): string {
  return launch.name ?? getLaunchPlaceholder(launch).name
}

export function getLaunchDisplaySymbol(launch: Launch): string {
  return launch.symbol ?? getLaunchPlaceholder(launch).symbol
}

export function getLaunchDisplayDescription(launch: Launch): string {
  return launch.description ?? getLaunchPlaceholder(launch).description
}

export function getLaunchLogoFallback(launch: Launch): string {
  if (launch.logoFallback) {
    return launch.logoFallback
  }

  const name = launch.name?.trim()

  if (name) {
    return name.charAt(0).toUpperCase()
  }

  return '🪙'
}

/** Update launch card header and description from verification metadata */
export function applyLaunchCardFromResult(
  launch: Launch,
  result: ReadTokenMintResult,
): void {
  if (!result.exists) {
    refreshLaunchAnalytics(launch)
    refreshLaunchRisk(launch)
    return
  }

  const card = document.getElementById(`launch-${launch.id}`)

  if (!card) {
    return
  }

  const displayName =
    result.jsonName ??
    result.metadataName ??
    launch.name

  const displaySymbol =
    result.jsonSymbol ??
    result.metadataSymbol ??
    launch.symbol

  const displayDescription =
    result.jsonDescription ??
    launch.description

  if (displayName) {
    const nameEl = card.querySelector<HTMLElement>('[data-token-name]')

    if (nameEl) {
      nameEl.textContent = displayName
    }
  }

  if (displaySymbol) {
    const symbolEl = card.querySelector<HTMLElement>('[data-token-symbol]')

    if (symbolEl) {
      symbolEl.textContent = displaySymbol
    }
  }

  if (displayDescription) {
    const descriptionEl = card.querySelector<HTMLElement>(
      '[data-token-description]',
    )

    if (descriptionEl) {
      descriptionEl.textContent = displayDescription
    }
  }

  applyTokenLogo(
    launch.id,
    resolveMetadataImageUrl(result.jsonImage ?? undefined),
    getLaunchLogoFallback(launch),
    displayName ?? getLaunchDisplayName(launch),
  )

  applyOfficialLinksFromMetadata(card, launch, result)
  applyTokenCategory(card, result)
  applyTokenTags(card, result)

  card.dataset.launchSearch = buildLaunchSearchText(launch, result)
  card.dataset.tokenCategorySlug = getLaunchFilterCategorySlug(launch, result)

  reapplyLaunchFilters(getLaunchCatalog())
  refreshLaunchAnalytics(launch)
  refreshLaunchRisk(launch)
}

export function applyTokenLogo(
  launchId: string,
  imageUrl: string | null,
  fallback: string,
  altName = 'Token logo',
): void {
  const wrap = document.querySelector<HTMLElement>(
    `[data-token-logo-wrap="${launchId}"]`,
  )

  if (!wrap) {
    return
  }

  wrap.querySelector('.token-logo')?.remove()
  wrap.classList.remove('has-metadata-logo')

  let fallbackEl = wrap.querySelector<HTMLElement>(
    '[data-token-logo-fallback]',
  )

  if (!fallbackEl) {
    fallbackEl = document.createElement('div')
    fallbackEl.className = 'token-icon token-icon--fallback'
    fallbackEl.setAttribute('data-token-logo-fallback', '')
    fallbackEl.setAttribute('aria-hidden', 'true')
    wrap.appendChild(fallbackEl)
  }

  fallbackEl.textContent = fallback
  fallbackEl.hidden = false
  fallbackEl.style.removeProperty('display')

  if (!imageUrl) {
    return
  }

  const img = document.createElement('img')
  img.className = 'token-logo'
  img.src = imageUrl
  img.alt = `${altName} logo`
  img.width = 64
  img.height = 64

  const showFallbackOnly = () => {
    img.remove()
    wrap.classList.remove('has-metadata-logo')
    fallbackEl!.hidden = false
    fallbackEl!.style.removeProperty('display')
  }

  const showImageOnly = () => {
    wrap.classList.add('has-metadata-logo')
    fallbackEl!.hidden = true
    fallbackEl!.style.display = 'none'
  }

  img.addEventListener('error', showFallbackOnly, { once: true })

  img.addEventListener(
    'load',
    () => {
      showImageOnly()
    },
    { once: true },
  )

  wrap.appendChild(img)

  if (img.complete) {
    if (img.naturalWidth > 0) {
      showImageOnly()
    } else {
      showFallbackOnly()
    }
  }
}
