/** Fallback when metadata JSON has no category field (CBS Token Builder convention) */
export const DEFAULT_METADATA_CATEGORY = 'Other'

/** Parse the raw `category` field from token metadata JSON */
export function parseMetadataCategoryValue(
  value: unknown,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed || null
}

/** Resolve a display category from metadata, falling back to Other */
export function resolveMetadataCategory(
  rawCategory: string | null | undefined,
): string {
  return formatMetadataCategoryDisplay(rawCategory)
}

/** Format category for display: "meme" → "Meme", "defi-token" → "Defi Token" */
export function formatMetadataCategoryDisplay(
  rawCategory: string | null | undefined,
): string {
  const trimmed = rawCategory?.trim()

  if (!trimmed) {
    return DEFAULT_METADATA_CATEGORY
  }

  return trimmed
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ')
}

/** Normalized slug for category filtering and data attributes */
export function categoryToFilterSlug(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'other'
}
