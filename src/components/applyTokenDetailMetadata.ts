import type { Launch } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import { getCachedMintVerificationCachedAt } from '../services/mintVerificationCache'
import {
  applyTokenLogo,
  getLaunchDisplayDescription,
  getLaunchDisplayName,
  getLaunchDisplaySymbol,
  getLaunchLogoFallback,
} from './applyLaunchCardMetadata'
import { resolveLaunchLogoUrl } from '../utils/resolveLaunchLogo'
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

  const displayName = getLaunchDisplayName(launch, result)
  const displaySymbol = getLaunchDisplaySymbol(launch, result)
  const displayDescription = getLaunchDisplayDescription(launch, result)

  setText(page, '[data-token-name]', displayName)
  setText(page, '[data-token-symbol]', displaySymbol)
  setText(page, '[data-token-description]', displayDescription)

  applyTokenLogo(
    launch.id,
    resolveLaunchLogoUrl(launch, result),
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
