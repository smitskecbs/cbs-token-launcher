import type { ReadTokenMintResult } from '../solana/verifyMint'
import {
  categoryToFilterSlug,
  DEFAULT_METADATA_CATEGORY,
  resolveMetadataCategory,
} from '../utils/metadataCategory'
import { escapeHtml } from '../utils/html'

interface RenderTokenCategoryFieldOptions {
  rowClass?: string
  value?: string
}

export function renderTokenCategoryField(
  options: RenderTokenCategoryFieldOptions = {},
): string {
  const rowClass = options.rowClass ?? 'launch-info-row'
  const value = escapeHtml(
    options.value ?? DEFAULT_METADATA_CATEGORY,
  )

  return `
    <div class="${escapeHtml(rowClass)}">
      <dt>Category</dt>
      <dd data-token-category>${value}</dd>
    </div>
  `
}

export function getCategoryDisplayFromResult(
  result: ReadTokenMintResult | null | undefined,
): string {
  if (!result?.exists) {
    return DEFAULT_METADATA_CATEGORY
  }

  if (!result.metadataJsonLoaded) {
    return DEFAULT_METADATA_CATEGORY
  }

  return resolveMetadataCategory(result.jsonCategory)
}

function getCategorySlugFromResult(
  result: ReadTokenMintResult | null | undefined,
): string {
  if (!result?.exists || !result.metadataJsonLoaded) {
    return categoryToFilterSlug(DEFAULT_METADATA_CATEGORY)
  }

  return categoryToFilterSlug(
    result.jsonCategory ?? DEFAULT_METADATA_CATEGORY,
  )
}

export function applyTokenCategory(
  root: ParentNode,
  result: ReadTokenMintResult | null | undefined,
): void {
  const category = getCategoryDisplayFromResult(result)
  const slug = getCategorySlugFromResult(result)

  const categoryElement = root.querySelector<HTMLElement>(
    '[data-token-category]',
  )

  if (categoryElement) {
    categoryElement.textContent = category
  }

  const filterTarget =
    root instanceof HTMLElement && root.matches('[data-token-card]')
      ? root
      : root.querySelector<HTMLElement>('[data-token-card]') ??
        (root instanceof HTMLElement &&
        root.matches('[data-token-detail]')
          ? root
          : root.querySelector<HTMLElement>('[data-token-detail]'))

  if (filterTarget) {
    filterTarget.setAttribute('data-token-category-slug', slug)
  }
}
