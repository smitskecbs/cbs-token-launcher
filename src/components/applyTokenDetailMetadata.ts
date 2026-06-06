import type { Launch } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import { resolveMetadataImageUrl } from '../solana/fetchTokenMetadataJson'
import { getCachedMintVerificationCachedAt } from '../services/mintVerificationCache'
import {
  applyTokenLogo,
  getLaunchLogoFallback,
} from './applyLaunchCardMetadata'
import {
  getDetailPageDescription,
  getDetailPageName,
  getDetailPageSymbol,
} from '../utils/launchDetailDisplay'
import { applyOfficialLinksFromMetadata } from './officialLinks'
import { applyTokenDetailMetadataPanel } from './tokenDetailMetadataPanel'
import { refreshLaunchAnalytics } from '../services/refreshLaunchAnalytics'
import { refreshLaunchRisk } from '../services/refreshLaunchRisk'

export function applyTokenDetailFromResult(
  launch: Launch,
  result: ReadTokenMintResult,
): void {
  const page = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"]`,
  )

  if (!page) {
    return
  }

  const displayName =
    result.jsonName ??
    result.metadataName ??
    getDetailPageName(launch)

  const displaySymbol =
    result.jsonSymbol ??
    result.metadataSymbol ??
    getDetailPageSymbol(launch)

  const displayDescription =
    result.jsonDescription ??
    getDetailPageDescription(launch)

  setText(page, '[data-token-name]', displayName)
  setText(page, '[data-token-symbol]', displaySymbol)
  setText(page, '[data-token-description]', displayDescription)

  applyTokenLogo(
    launch.id,
    resolveMetadataImageUrl(result.jsonImage ?? undefined),
    getLaunchLogoFallback(launch),
    displayName,
  )

  applyTokenDetailMetadataPanel(launch, result, {
    refreshedAtMs:
      getCachedMintVerificationCachedAt(launch.mintAddress) ?? Date.now(),
  })

  if (result.error) {
    showChainStatus(page, result.error, 'token-chain-status--error')
  } else if (!result.exists) {
    showChainStatus(page, 'Mint not found', 'token-chain-status--missing')
  } else {
    clearChainStatus(page)
  }

  applyOfficialLinksFromMetadata(page, launch, result)
  refreshLaunchAnalytics(launch)
  refreshLaunchRisk(launch)
}

function showChainStatus(
  root: HTMLElement,
  message: string,
  className: string,
): void {
  const element = root.querySelector<HTMLElement>('[data-token-chain-status]')

  if (!element) {
    return
  }

  element.hidden = false
  element.textContent = message
  element.className = `token-chain-status ${className}`
}

export function setTokenDetailLoading(launch: Launch): void {
  const page = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"]`,
  )

  if (!page) {
    return
  }

  applyTokenDetailMetadataPanel(launch, null, { loading: true })

  const status = page.querySelector<HTMLElement>('[data-token-chain-status]')

  if (status) {
    status.hidden = false
    status.textContent = 'Loading on-chain data…'
    status.className = 'token-chain-status'
  }
}

function setText(
  root: HTMLElement,
  selector: string,
  value: string,
  statusClass?: string,
): void {
  const element = root.querySelector<HTMLElement>(selector)

  if (!element) {
    return
  }

  element.textContent = value

  if (statusClass) {
    element.classList.add(statusClass)
  }
}

function clearChainStatus(root: HTMLElement): void {
  const element = root.querySelector<HTMLElement>('[data-token-chain-status]')

  if (!element) {
    return
  }

  element.textContent = ''
  element.hidden = true
}
