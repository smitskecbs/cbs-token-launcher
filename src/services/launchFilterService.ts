import type { Launch } from '../types/launch'
import type {
  LaunchCategoryFilterId,
  LaunchFilterState,
  LaunchStatusFilterId,
} from '../types/launchFilters'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import {
  categoryToFilterSlug,
  DEFAULT_METADATA_CATEGORY,
  resolveMetadataCategory,
} from '../utils/metadataCategory'
import { getResolvedLaunchCategory } from './categoryService'

function readDisplayName(
  launch: Launch,
  result?: ReadTokenMintResult | null,
): string {
  return (
    result?.jsonName?.trim() ||
    result?.metadataName?.trim() ||
    launch.name?.trim() ||
    launch.symbol?.trim() ||
    launch.id
  )
}

function readDisplaySymbol(
  launch: Launch,
  result?: ReadTokenMintResult | null,
): string {
  return (
    result?.jsonSymbol?.trim() ||
    result?.metadataSymbol?.trim() ||
    launch.symbol?.trim() ||
    ''
  )
}

function readCategoryLabel(
  launch: Launch,
  result?: ReadTokenMintResult | null,
): string {
  if (result?.exists && result.metadataJsonLoaded) {
    return resolveMetadataCategory(result.jsonCategory)
  }

  return getResolvedLaunchCategory(launch)
}

export function normalizeLaunchCategorySlug(
  category: string,
): LaunchCategoryFilterId {
  const slug = categoryToFilterSlug(category)

  switch (slug) {
    case 'community':
      return 'community'
    case 'meme':
      return 'meme'
    case 'gaming':
      return 'gaming'
    case 'defi':
    case 'de-fi':
      return 'defi'
    case 'utility':
      return 'utility'
    default:
      return 'other'
  }
}

export function buildLaunchSearchText(
  launch: Launch,
  result?: ReadTokenMintResult | null,
): string {
  const name = readDisplayName(launch, result)
  const symbol = readDisplaySymbol(launch, result)
  const category = readCategoryLabel(launch, result)

  return [name, symbol, launch.mintAddress, category]
    .join(' ')
    .toLowerCase()
}

export function getLaunchFilterCategorySlug(
  launch: Launch,
  result?: ReadTokenMintResult | null,
): LaunchCategoryFilterId {
  const category = readCategoryLabel(launch, result)

  return normalizeLaunchCategorySlug(category || DEFAULT_METADATA_CATEGORY)
}

export function matchesLaunchSearch(
  searchText: string,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return searchText.includes(normalizedQuery)
}

export function matchesLaunchCategoryFilter(
  categorySlug: LaunchCategoryFilterId | string,
  filter: LaunchCategoryFilterId,
): boolean {
  if (filter === 'all') {
    return true
  }

  return categorySlug === filter
}

export function matchesLaunchStatusFilter(
  launchStatus: string,
  launchSection: string,
  filter: LaunchStatusFilterId,
): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'live') {
    return launchStatus === 'live'
  }

  if (filter === 'preparing') {
    return launchStatus === 'preparing'
  }

  return launchSection === 'upcoming'
}

export function launchMatchesFilters(
  launch: Launch,
  state: LaunchFilterState,
  options: {
    searchText?: string
    categorySlug?: LaunchCategoryFilterId | string
  } = {},
): boolean {
  const searchText =
    options.searchText?.toLowerCase() ??
    buildLaunchSearchText(launch).toLowerCase()
  const categorySlug =
    options.categorySlug ?? getLaunchFilterCategorySlug(launch)

  return (
    matchesLaunchSearch(searchText, state.query) &&
    matchesLaunchCategoryFilter(categorySlug, state.category) &&
    matchesLaunchStatusFilter(launch.status, launch.section, state.status)
  )
}

export function formatLaunchFilterResultCount(count: number): string {
  const label = count === 1 ? 'launch' : 'launches'

  return `Showing ${count} ${label}`
}
