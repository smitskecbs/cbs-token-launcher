import type { Launch } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import { resolveMetadataImageUrl } from '../solana/fetchTokenMetadataJson'
import { formatSupply } from '../utils/formatSupply'
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
import { applyTokenCategory } from './tokenCategoryField'
import { applyTokenTags } from './tokenTagsField'
import { formatRawMetadataText } from './mintVerificationPanel'
import { refreshLaunchAnalytics } from '../services/refreshLaunchAnalytics'
import { refreshLaunchRisk } from '../services/refreshLaunchRisk'

const LOADING = 'Loading…'
const EMPTY = '—'
const UNAVAILABLE = 'Not available'

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

  setText(page, '[data-token-decimals]', formatDecimals(result))
  setText(page, '[data-token-supply]', formatSupplyValue(result))
  setText(page, '[data-token-metadata-uri]', formatMetadataUri(result))
  setText(page, '[data-token-metadata-raw]', formatRawMetadataDisplay(result))

  if (result.error) {
    showChainStatus(page, result.error, 'token-chain-status--error')
  } else if (!result.exists) {
    showChainStatus(page, 'Mint not found', 'token-chain-status--missing')
  } else {
    clearChainStatus(page)
  }

  applyOfficialLinksFromMetadata(page, launch, result)
  applyTokenCategory(page, result)
  applyTokenTags(page, result)
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

  setText(page, '[data-token-decimals]', LOADING)
  setText(page, '[data-token-supply]', LOADING)
  setText(page, '[data-token-metadata-uri]', LOADING)
  setText(page, '[data-token-metadata-raw]', LOADING)

  const status = page.querySelector<HTMLElement>('[data-token-chain-status]')

  if (status) {
    status.hidden = false
    status.textContent = 'Loading on-chain data…'
    status.className = 'token-chain-status'
  }
}

function formatDecimals(result: ReadTokenMintResult): string {
  if (result.error || !result.exists) {
    return UNAVAILABLE
  }

  return result.decimals !== null ? String(result.decimals) : UNAVAILABLE
}

function formatSupplyValue(result: ReadTokenMintResult): string {
  if (result.error || !result.exists) {
    return UNAVAILABLE
  }

  if (result.supply === null) {
    return UNAVAILABLE
  }

  return formatSupply(result.supply, result.decimals ?? 0)
}

function formatMetadataUri(result: ReadTokenMintResult): string {
  if (result.error || !result.exists) {
    return UNAVAILABLE
  }

  if (!result.metadataFound) {
    return 'Metadata not found on-chain'
  }

  return result.metadataUri ?? UNAVAILABLE
}

function formatRawMetadataDisplay(result: ReadTokenMintResult): string {
  if (result.error || !result.exists) {
    return UNAVAILABLE
  }

  const raw = formatRawMetadataText(result)

  return raw === EMPTY ? 'No raw metadata available' : raw
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
