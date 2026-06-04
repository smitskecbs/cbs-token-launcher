/** Category filter chips shown on the homepage */
export const LAUNCH_CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'community', label: 'Community' },
  { id: 'meme', label: 'Meme' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'defi', label: 'DeFi' },
  { id: 'utility', label: 'Utility' },
  { id: 'other', label: 'Other' },
] as const

export type LaunchCategoryFilterId =
  (typeof LAUNCH_CATEGORY_FILTERS)[number]['id']

/** Launch status filter chips */
export const LAUNCH_STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'coming-soon', label: 'Coming Soon' },
] as const

export type LaunchStatusFilterId =
  (typeof LAUNCH_STATUS_FILTERS)[number]['id']

export interface LaunchFilterState {
  query: string
  category: LaunchCategoryFilterId
  status: LaunchStatusFilterId
}

export const DEFAULT_LAUNCH_FILTER_STATE: LaunchFilterState = {
  query: '',
  category: 'all',
  status: 'all',
}

export function isLaunchFilterActive(state: LaunchFilterState): boolean {
  return (
    state.query.trim().length > 0 ||
    state.category !== 'all' ||
    state.status !== 'all'
  )
}
