import type { ReadTokenMintResult } from '../solana/verifyMint'
import { escapeHtml } from '../utils/html'
import { formatSupply } from '../utils/formatSupply'

export function verifyPanelId(launchId: string): string {
  return `verify-panel-${launchId}`
}

/** Empty verification panel — populated on Verify Mint click */
export function renderVerifyPanel(launchId: string): string {
  const id = escapeHtml(launchId)

  return `
    <div
      class="verify-panel"
      id="${verifyPanelId(id)}"
      aria-live="polite"
      hidden
    ></div>
  `
}

export function showVerifyChecking(panel: HTMLElement): void {
  panel.hidden = false
  panel.className = 'verify-panel verify-panel--checking'
  panel.innerHTML = `
    <span class="verify-label">Mint Verification</span>
    <p class="verify-status">Checking...</p>
  `
}

export interface VerifyResultDisplayOptions {
  fromCache?: boolean
  launchId?: string
}

export function showVerifyResult(
  panel: HTMLElement,
  result: ReadTokenMintResult,
  options: VerifyResultDisplayOptions = {},
): void {
  panel.hidden = false

  const cacheFooter = options.fromCache
    ? renderCacheFooter(options.launchId)
    : ''

  if (result.error) {
    panel.className = 'verify-panel verify-panel--error'
    panel.innerHTML = `
      <span class="verify-label">Mint Verification</span>
      <p class="verify-status verify-status--error">${escapeHtml(result.error)}</p>
      ${cacheFooter}
    `
    return
  }

  if (!result.exists) {
    panel.className = 'verify-panel verify-panel--missing'
    panel.innerHTML = `
      <span class="verify-label">Mint Verification</span>
      <p class="verify-status verify-status--missing">Mint not found</p>
      ${cacheFooter}
    `
    return
  }

  const decimals =
    result.decimals !== null
      ? String(result.decimals)
      : '—'

  const supply =
    result.supply !== null
      ? formatSupply(result.supply, result.decimals ?? 0)
      : '—'

  const name =
    result.jsonName ??
    result.metadataName ??
    '—'

  const symbol =
    result.jsonSymbol ??
    result.metadataSymbol ??
    '—'

  const summaryRows = renderSummaryRows(decimals, supply, name, symbol)
  const expandedRows = renderExpandedMetadataRows(result)
  const expandButton = expandedRows
    ? `
    <button
      type="button"
      class="verify-expand-btn secondary-btn"
      data-verify-expand
      aria-expanded="false"
    >
      Show Full Metadata
    </button>
  `
    : ''

  panel.className = 'verify-panel verify-panel--found'
  panel.innerHTML = `
    <span class="verify-label">Mint Verification</span>
    <p class="verify-status verify-status--found">Mint found</p>
    <dl class="verify-details verify-details--summary">
      ${summaryRows}
    </dl>
    ${expandButton}
    ${
      expandedRows
        ? `
    <div class="verify-details-expand" data-verify-expanded hidden>
      <dl class="verify-details">
        ${expandedRows}
      </dl>
    </div>
  `
        : ''
    }
    ${cacheFooter}
  `
}

function renderSummaryRows(
  decimals: string,
  supply: string,
  name: string,
  symbol: string,
): string {
  return `
    <div class="verify-detail">
      <dt>Name</dt>
      <dd>${escapeHtml(name)}</dd>
    </div>
    <div class="verify-detail">
      <dt>Symbol</dt>
      <dd>${escapeHtml(symbol)}</dd>
    </div>
    <div class="verify-detail">
      <dt>Supply</dt>
      <dd>${escapeHtml(supply)}</dd>
    </div>
    <div class="verify-detail">
      <dt>Decimals</dt>
      <dd>${escapeHtml(decimals)}</dd>
    </div>
  `
}

function renderExpandedMetadataRows(
  result: ReadTokenMintResult,
): string {
  if (!result.metadataFound) {
    return `
      <div class="verify-detail verify-detail--full">
        <dt>Metadata</dt>
        <dd class="verify-status--missing">Metadata not found</dd>
      </div>
    `
  }

  const description =
    result.jsonDescription?.trim() || '—'
  const uri = result.metadataUri ?? '—'

  const externalUrlRow =
    result.jsonExternalUrl
      ? `
    <div class="verify-detail verify-detail--full">
      <dt>External URL</dt>
      <dd class="verify-metadata-uri">${escapeHtml(result.jsonExternalUrl)}</dd>
    </div>
  `
      : ''

  const jsonStatusRow =
    result.metadataUri && !result.metadataJsonLoaded
      ? `
    <div class="verify-detail verify-detail--full">
      <dt>Metadata JSON</dt>
      <dd class="verify-status--missing">Could not load JSON from URI</dd>
    </div>
  `
      : ''

  const rawMetadata = renderRawMetadataBlock(result)

  return `
    <div class="verify-detail verify-detail--full">
      <dt>Description</dt>
      <dd class="verify-metadata-text">${escapeHtml(description)}</dd>
    </div>
    <div class="verify-detail verify-detail--full">
      <dt>Metadata URI</dt>
      <dd class="verify-metadata-uri">${escapeHtml(uri)}</dd>
    </div>
    ${externalUrlRow}
    ${jsonStatusRow}
    ${rawMetadata}
  `
}

function renderRawMetadataBlock(result: ReadTokenMintResult): string {
  const lines: string[] = [
    `On-chain name: ${result.metadataName ?? '—'}`,
    `On-chain symbol: ${result.metadataSymbol ?? '—'}`,
    `Metadata URI: ${result.metadataUri ?? '—'}`,
  ]

  if (result.metadataJsonLoaded) {
    lines.push(
      `JSON name: ${result.jsonName ?? '—'}`,
      `JSON symbol: ${result.jsonSymbol ?? '—'}`,
      `JSON image: ${result.jsonImage ?? '—'}`,
      `JSON external URL: ${result.jsonExternalUrl ?? '—'}`,
      `JSON category: ${result.jsonCategory ?? '—'}`,
      `JSON tags: ${
        result.jsonTags.length > 0
          ? result.jsonTags.join(', ')
          : '—'
      }`,
    )

    const socialEntries = Object.entries(result.jsonSocialLinks).filter(
      ([, value]) => Boolean(value?.trim()),
    )

    if (socialEntries.length > 0) {
      for (const [key, value] of socialEntries) {
        lines.push(`JSON ${key}: ${value}`)
      }
    }
  } else if (result.metadataUri) {
    lines.push('JSON metadata: unavailable')
  }

  return `
    <div class="verify-detail verify-detail--full">
      <dt>Raw Metadata</dt>
      <dd class="verify-metadata-raw">${escapeHtml(lines.join('\n'))}</dd>
    </div>
  `
}

function renderCacheFooter(launchId?: string): string {
  const refreshButton =
    launchId
      ? `
    <button
      type="button"
      class="verify-refresh-btn"
      data-refresh-verify="${escapeHtml(launchId)}"
    >
      Refresh
    </button>
  `
      : ''

  return `
    <div class="verify-cache-footer">
      <p class="verify-cache-note">
        Cached for 10 minutes to reduce RPC usage.
      </p>
      ${refreshButton}
    </div>
  `
}

export function toggleVerifyPanelExpanded(
  panel: HTMLElement,
  button: HTMLButtonElement,
): void {
  const expanded = panel.querySelector<HTMLElement>(
    '[data-verify-expanded]',
  )

  if (!expanded) {
    return
  }

  const isOpen = !expanded.hidden
  expanded.hidden = isOpen
  button.setAttribute('aria-expanded', String(!isOpen))
  button.textContent = isOpen
    ? 'Show Full Metadata'
    : 'Hide Full Metadata'
}
