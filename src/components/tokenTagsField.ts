import type { ReadTokenMintResult } from '../solana/verifyMint'
import { formatMetadataTagLabel } from '../utils/metadataFields'
import { escapeHtml } from '../utils/html'

export function renderTokenTagsPanel(): string {
  return `
    <div class="token-tags-panel" data-token-tags-panel hidden>
      <span class="launch-info-links-label">Tags</span>
      <div class="token-tags" data-token-tags></div>
    </div>
  `
}

export function renderTokenTagBadges(tags: string[]): string {
  return tags
    .map(
      (tag) => `
        <span class="token-tag">${escapeHtml(formatMetadataTagLabel(tag))}</span>
      `,
    )
    .join('')
}

export function getTagsFromResult(
  result: ReadTokenMintResult | null | undefined,
): string[] {
  if (!result?.exists || !result.metadataJsonLoaded) {
    return []
  }

  return result.jsonTags
}

export function applyTokenTags(
  root: ParentNode,
  result: ReadTokenMintResult | null | undefined,
): void {
  const tags = getTagsFromResult(result)
  const panel = root.querySelector<HTMLElement>('[data-token-tags-panel]')
  const container = root.querySelector<HTMLElement>('[data-token-tags]')

  if (!panel || !container) {
    return
  }

  if (tags.length === 0) {
    panel.hidden = true
    container.innerHTML = ''
    return
  }

  panel.hidden = false
  container.innerHTML = renderTokenTagBadges(tags)
}
