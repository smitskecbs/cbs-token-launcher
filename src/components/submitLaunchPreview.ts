import type { ReadTokenMintResult } from '../solana/verifyMint'
import { resolveMetadataImageUrl } from '../solana/fetchTokenMetadataJson'
import {
  formatMetadataCategoryDisplay,
  resolveMetadataCategory,
} from '../utils/metadataCategory'
import type { MetadataSocialLinks } from '../utils/metadataFields'
import { renderTokenTagBadges } from './tokenTagsField'
import { escapeHtml } from '../utils/html'

const EMPTY = '—'

export function renderSubmitLaunchPreview(): string {
  return `
    <div
      class="submit-launch-preview"
      data-submit-preview
      hidden
    >
      <span class="submit-launch-preview-label">Launch preview</span>
      <p class="submit-launch-preview-hint">
        Confirm this token matches your CBS Token Builder metadata before submitting.
      </p>
      <article class="submit-launch-preview-card launch-card">
        <div class="token-header">
          <div
            class="token-logo-wrap"
            data-submit-preview-logo-wrap
          >
            <div
              class="token-icon token-icon--fallback"
              data-submit-preview-logo-fallback
              aria-hidden="true"
            >
              🪙
            </div>
          </div>
          <div>
            <h3 data-submit-preview-name>${EMPTY}</h3>
            <p class="token-symbol" data-submit-preview-symbol>${EMPTY}</p>
          </div>
        </div>

        <div class="launch-details">
          <p data-submit-preview-description>${EMPTY}</p>
        </div>

        <dl class="launch-info-details submit-launch-preview-details">
          <div class="launch-info-row">
            <dt>Category</dt>
            <dd data-submit-preview-category>${EMPTY}</dd>
          </div>
          <div class="launch-info-row" data-submit-preview-tags-wrap hidden>
            <dt>Tags</dt>
            <dd>
              <div class="token-tags submit-launch-preview-tags" data-submit-preview-tags></div>
            </dd>
          </div>
          <div class="launch-info-row">
            <dt>Website</dt>
            <dd data-submit-preview-website>${EMPTY}</dd>
          </div>
          <div class="launch-info-row">
            <dt>Telegram</dt>
            <dd data-submit-preview-telegram>${EMPTY}</dd>
          </div>
          <div class="launch-info-row">
            <dt>X</dt>
            <dd data-submit-preview-twitter>${EMPTY}</dd>
          </div>
        </dl>
      </article>
    </div>
  `
}

export function canSubmitVerifiedMint(
  result: ReadTokenMintResult | null | undefined,
): boolean {
  return Boolean(
    result?.exists &&
      result.metadataFound &&
      !result.error,
  )
}

function getPreviewSocialLinks(
  result: ReadTokenMintResult,
): MetadataSocialLinks {
  if (result.metadataJsonLoaded) {
    return result.jsonSocialLinks
  }

  const website = result.jsonExternalUrl?.trim()

  return website ? { website } : {}
}

export function applySubmitLaunchPreview(
  previewRoot: HTMLElement,
  result: ReadTokenMintResult | null,
): void {
  if (!result || !canSubmitVerifiedMint(result)) {
    clearSubmitLaunchPreview(previewRoot)
    return
  }

  previewRoot.hidden = false

  const name =
    result.jsonName ??
    result.metadataName ??
    'Unknown token'
  const symbol =
    result.jsonSymbol ??
    result.metadataSymbol ??
    EMPTY
  const description =
    result.jsonDescription?.trim() ||
    'No description in metadata.'

  setText(previewRoot, '[data-submit-preview-name]', name)
  setText(previewRoot, '[data-submit-preview-symbol]', symbol)
  setText(previewRoot, '[data-submit-preview-description]', description)

  const category = result.metadataJsonLoaded
    ? formatMetadataCategoryDisplay(result.jsonCategory)
    : formatMetadataCategoryDisplay(null)

  setText(previewRoot, '[data-submit-preview-category]', category)

  applyPreviewLogo(previewRoot, result, name, symbol)
  applyPreviewTags(previewRoot, result)

  const socials = getPreviewSocialLinks(result)
  applyPreviewLink(previewRoot, '[data-submit-preview-website]', socials.website)
  applyPreviewLink(previewRoot, '[data-submit-preview-telegram]', socials.telegram)
  applyPreviewLink(previewRoot, '[data-submit-preview-twitter]', socials.twitter)
}

export function clearSubmitLaunchPreview(previewRoot: HTMLElement): void {
  previewRoot.hidden = true
  setText(previewRoot, '[data-submit-preview-name]', EMPTY)
  setText(previewRoot, '[data-submit-preview-symbol]', EMPTY)
  setText(previewRoot, '[data-submit-preview-description]', EMPTY)
  setText(
    previewRoot,
    '[data-submit-preview-category]',
    resolveMetadataCategory(null),
  )
  setText(previewRoot, '[data-submit-preview-website]', EMPTY)
  setText(previewRoot, '[data-submit-preview-telegram]', EMPTY)
  setText(previewRoot, '[data-submit-preview-twitter]', EMPTY)

  const logoWrap = previewRoot.querySelector<HTMLElement>(
    '[data-submit-preview-logo-wrap]',
  )
  const fallback = previewRoot.querySelector<HTMLElement>(
    '[data-submit-preview-logo-fallback]',
  )

  logoWrap?.querySelector('img')?.remove()

  if (fallback) {
    fallback.textContent = '🪙'
    fallback.hidden = false
  }

  const tagsWrap = previewRoot.querySelector<HTMLElement>(
    '[data-submit-preview-tags-wrap]',
  )
  const tagsContainer = previewRoot.querySelector<HTMLElement>(
    '[data-submit-preview-tags]',
  )

  if (tagsWrap) {
    tagsWrap.hidden = true
  }

  if (tagsContainer) {
    tagsContainer.innerHTML = ''
  }
}

function applyPreviewLogo(
  root: HTMLElement,
  result: ReadTokenMintResult,
  name: string,
  symbol: string,
): void {
  const wrap = root.querySelector<HTMLElement>(
    '[data-submit-preview-logo-wrap]',
  )
  const fallback = root.querySelector<HTMLElement>(
    '[data-submit-preview-logo-fallback]',
  )

  if (!wrap || !fallback) {
    return
  }

  wrap.querySelector('img')?.remove()
  wrap.classList.remove('has-metadata-logo')

  const fallbackChar =
    symbol !== EMPTY
      ? symbol.charAt(0).toUpperCase()
      : name.charAt(0).toUpperCase() || '🪙'

  fallback.textContent = fallbackChar
  fallback.hidden = false

  const imageUrl = resolveMetadataImageUrl(result.jsonImage ?? undefined)

  if (!imageUrl) {
    return
  }

  const img = document.createElement('img')
  img.className = 'token-logo'
  img.src = imageUrl
  img.alt = `${name} logo`
  img.width = 64
  img.height = 64

  img.addEventListener(
    'error',
    () => {
      img.remove()
      wrap.classList.remove('has-metadata-logo')
      fallback.hidden = false
    },
    { once: true },
  )

  img.addEventListener(
    'load',
    () => {
      wrap.classList.add('has-metadata-logo')
      fallback.hidden = true
    },
    { once: true },
  )

  wrap.appendChild(img)
}

function applyPreviewTags(
  root: HTMLElement,
  result: ReadTokenMintResult,
): void {
  const tagsWrap = root.querySelector<HTMLElement>(
    '[data-submit-preview-tags-wrap]',
  )
  const tagsContainer = root.querySelector<HTMLElement>(
    '[data-submit-preview-tags]',
  )

  if (!tagsWrap || !tagsContainer) {
    return
  }

  const tags = result.metadataJsonLoaded ? result.jsonTags : []

  if (tags.length === 0) {
    tagsWrap.hidden = true
    tagsContainer.innerHTML = ''
    return
  }

  tagsWrap.hidden = false
  tagsContainer.innerHTML = renderTokenTagBadges(tags)
}

function applyPreviewLink(
  root: ParentNode,
  selector: string,
  url: string | undefined,
): void {
  const element = root.querySelector<HTMLElement>(selector)

  if (!element) {
    return
  }

  const trimmed = url?.trim()

  if (!trimmed) {
    element.textContent = EMPTY
    return
  }

  element.innerHTML = `
    <a
      class="submit-launch-preview-link"
      href="${escapeHtml(trimmed)}"
      target="_blank"
      rel="noopener noreferrer"
    >
      ${escapeHtml(trimmed)}
    </a>
  `
}

function setText(
  root: ParentNode,
  selector: string,
  value: string,
): void {
  const element = root.querySelector<HTMLElement>(selector)

  if (element) {
    element.textContent = value
  }
}
