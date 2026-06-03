import type { Launch } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import {
  categoryToFilterSlug,
  DEFAULT_METADATA_CATEGORY,
  resolveMetadataCategory,
} from '../utils/metadataCategory'
import { getCachedMintVerification } from './mintVerificationCache'

/** Category from a verification result, or null if metadata is not loaded yet */
export function getCategoryFromVerificationResult(
  result: ReadTokenMintResult | null | undefined,
): string | null {
  if (!result?.exists || !result.metadataJsonLoaded) {
    return null
  }

  return resolveMetadataCategory(result.jsonCategory)
}

/** Category from cached mint verification for a launch */
export function getLaunchCategoryFromCache(
  launch: Launch,
): string | null {
  return getCategoryFromVerificationResult(
    getCachedMintVerification(launch.mintAddress),
  )
}

/** Resolved category for display/filtering — uses Other when metadata is unavailable */
export function getResolvedLaunchCategory(
  launch: Launch,
  category: string | null = getLaunchCategoryFromCache(launch),
): string {
  return category ?? DEFAULT_METADATA_CATEGORY
}

/** Filter launches by metadata category (case-insensitive slug match) */
export function filterLaunchesByCategory(
  launches: Launch[],
  category: string,
  resolveCategory: (launch: Launch) => string | null = getLaunchCategoryFromCache,
): Launch[] {
  const targetSlug = categoryToFilterSlug(category)

  return launches.filter((launch) => {
    const resolved = resolveCategory(launch) ?? DEFAULT_METADATA_CATEGORY

    return categoryToFilterSlug(resolved) === targetSlug
  })
}

/** Collect unique metadata categories from launches (sorted for filter UI) */
export function collectMetadataCategories(
  launches: Launch[],
  resolveCategory: (launch: Launch) => string | null = getLaunchCategoryFromCache,
): string[] {
  const categories = new Set<string>()

  for (const launch of launches) {
    categories.add(resolveCategory(launch) ?? DEFAULT_METADATA_CATEGORY)
  }

  return [...categories].sort((a, b) => a.localeCompare(b))
}
