import type { Launch } from '../types/launch'
import {
  LAUNCH_CARD_AUTO_LOAD_PLACEHOLDER,
  LAUNCH_CARD_PLACEHOLDER,
} from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import { getCachedMintVerification } from '../services/mintVerificationCache'
import { resolveLaunchLogoUrl } from '../utils/resolveLaunchLogo'
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
import {
  isHydratingLaunchSearchResults,
  reapplyLaunchFilters,
} from './launchFiltersPanel'
import { applyLaunchCardMetadataSummary } from './launchCardMetadataSummary'
import { forEachLaunchCardElement } from './launchCard'

/** Session cache of logo URLs that already loaded successfully in this tab */
const loadedTokenLogoUrls = new Set<string>()

function getLaunchPlaceholder(launch: Launch) {
  return launch.autoLoadMetadata
    ? LAUNCH_CARD_AUTO_LOAD_PLACEHOLDER
    : LAUNCH_CARD_PLACEHOLDER
}

function resolveMintResult(
  launch: Launch,
  mintResult?: ReadTokenMintResult | null,
): ReadTokenMintResult | null {
  if (mintResult !== undefined) {
    return mintResult
  }

  return getCachedMintVerification(launch.mintAddress)
}

export function getLaunchDisplayName(
  launch: Launch,
  mintResult?: ReadTokenMintResult | null,
): string {
  const result = resolveMintResult(launch, mintResult)
  const resolved = result?.jsonName ?? result?.metadataName ?? launch.name

  return resolved?.trim() || getLaunchPlaceholder(launch).name
}

export function getLaunchDisplaySymbol(
  launch: Launch,
  mintResult?: ReadTokenMintResult | null,
): string {
  const result = resolveMintResult(launch, mintResult)
  const resolved = result?.jsonSymbol ?? result?.metadataSymbol ?? launch.symbol

  return resolved?.trim() || getLaunchPlaceholder(launch).symbol
}

export function getLaunchDisplayDescription(
  launch: Launch,
  mintResult?: ReadTokenMintResult | null,
): string {
  const result = resolveMintResult(launch, mintResult)
  const resolved = result?.jsonDescription ?? launch.description

  return resolved?.trim() || getLaunchPlaceholder(launch).description
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
  applyLaunchCardMetadataSummary(launch, result)

  if (!result.exists) {
    refreshLaunchAnalytics(launch)
    refreshLaunchRisk(launch)
    return
  }

  const displayName = getLaunchDisplayName(launch, result)
  const displaySymbol = getLaunchDisplaySymbol(launch, result)
  const displayDescription = getLaunchDisplayDescription(launch, result)
  let updatedCard = false

  forEachLaunchCardElement(launch.id, (card) => {
    updatedCard = true

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

    applyOfficialLinksFromMetadata(card, launch, result)
    applyTokenCategory(card, result)
    applyTokenTags(card, result)

    card.dataset.launchSearch = buildLaunchSearchText(launch, result)
    card.dataset.tokenCategorySlug = getLaunchFilterCategorySlug(launch, result)
  })

  if (!updatedCard) {
    return
  }

  applyTokenLogo(
    launch.id,
    resolveLaunchLogoUrl(launch, result),
    getLaunchLogoFallback(launch),
    displayName,
  )

  if (!isHydratingLaunchSearchResults()) {
    reapplyLaunchFilters(getLaunchCatalog())
  }

  refreshLaunchAnalytics(launch)
  refreshLaunchRisk(launch)
}

export function applyTokenLogo(
  launchId: string,
  imageUrl: string | null,
  fallback: string,
  altName = 'Token logo',
): void {
  const wraps = document.querySelectorAll<HTMLElement>(
    `[data-token-logo-wrap="${launchId}"]`,
  )

  if (wraps.length === 0) {
    return
  }

  for (const wrap of wraps) {
    applyTokenLogoToWrap(wrap, imageUrl, fallback, altName)
  }
}

function applyTokenLogoToWrap(
  wrap: HTMLElement,
  imageUrl: string | null,
  fallback: string,
  altName: string,
): void {
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
    loadedTokenLogoUrls.add(imageUrl)
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

  if (loadedTokenLogoUrls.has(imageUrl)) {
    showImageOnly()
    return
  }

  if (img.complete) {
    if (img.naturalWidth > 0) {
      showImageOnly()
    } else {
      showFallbackOnly()
    }
  }
}
