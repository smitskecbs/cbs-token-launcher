import type { Launch } from '../types/launch'
import {
  DEFAULT_LAUNCH_FILTER_STATE,
  LAUNCH_CATEGORY_FILTERS,
  LAUNCH_STATUS_FILTERS,
  type LaunchFilterState,
  isLaunchFilterActive,
} from '../types/launchFilters'
import {
  formatLaunchFilterResultCount,
} from '../services/launchFilterService'
import { escapeHtml } from '../utils/html'

const FILTER_HIDDEN_CLASS = 'is-filter-hidden'
const SECTION_EMPTY_CLASS = 'is-section-filter-empty'
const LAUNCH_FILTER_SECTIONS = new Set([
  'featured',
  'trending',
  'new',
  'upcoming',
  'ecosystem',
])

let filterState: LaunchFilterState = { ...DEFAULT_LAUNCH_FILTER_STATE }

export function renderLaunchFiltersPanel(): string {
  return `
    <section
      class="launch-filters-panel"
      data-launch-filters-root
      aria-label="Search and filter launches"
    >
      <label class="launch-filters-search">
        <span class="visually-hidden">Search launches</span>
        <input
          class="launch-filters-search-input"
          type="search"
          data-launch-filter-search
          placeholder="Search by token name, symbol or mint address..."
          autocomplete="off"
          spellcheck="false"
          enterkeyhint="search"
        />
      </label>

      <div class="launch-filters-group">
        <span class="launch-filters-label">Category</span>
        <div
          class="launch-filters-chips"
          role="group"
          aria-label="Category filters"
          data-launch-filter-category-group
        >
          ${LAUNCH_CATEGORY_FILTERS.map((option) =>
            renderFilterChip(
              'category',
              option.id,
              option.label,
              option.id === 'all',
            ),
          ).join('')}
        </div>
      </div>

      <div class="launch-filters-group">
        <span class="launch-filters-label">Status</span>
        <div
          class="launch-filters-chips"
          role="group"
          aria-label="Launch status filters"
          data-launch-filter-status-group
        >
          ${LAUNCH_STATUS_FILTERS.map((option) =>
            renderFilterChip(
              'status',
              option.id,
              option.label,
              option.id === 'all',
            ),
          ).join('')}
        </div>
      </div>

      <p
        class="launch-filters-result-count"
        data-launch-filter-result-count
        aria-live="polite"
      >
        ${escapeHtml(formatLaunchFilterResultCount(0))}
      </p>
    </section>
  `
}

function renderFilterChip(
  kind: 'category' | 'status',
  value: string,
  label: string,
  selected: boolean,
): string {
  const id = escapeHtml(value)
  const text = escapeHtml(label)

  return `
    <button
      type="button"
      class="launch-filter-chip${selected ? ' launch-filter-chip--active' : ''}"
      data-launch-filter-${kind}="${id}"
      aria-pressed="${selected ? 'true' : 'false'}"
    >
      ${text}
    </button>
  `
}

export function attachLaunchFilters(
  launches: Launch[],
  options: { initialCount?: number } = {},
): void {
  const root = document.querySelector<HTMLElement>(
    '[data-launch-filters-root]',
  )

  if (!root) {
    return
  }

  const searchInput = root.querySelector<HTMLInputElement>(
    '[data-launch-filter-search]',
  )

  searchInput?.addEventListener('input', () => {
    applyLaunchFiltersFromDom(launches)
  })

  for (const button of root.querySelectorAll<HTMLButtonElement>(
    '[data-launch-filter-category]',
  )) {
    button.addEventListener('click', () => {
      setActiveChip(
        root,
        'category',
        button.getAttribute('data-launch-filter-category') ?? 'all',
      )
      applyLaunchFiltersFromDom(launches)
    })
  }

  for (const button of root.querySelectorAll<HTMLButtonElement>(
    '[data-launch-filter-status]',
  )) {
    button.addEventListener('click', () => {
      setActiveChip(
        root,
        'status',
        button.getAttribute('data-launch-filter-status') ?? 'all',
      )
      applyLaunchFiltersFromDom(launches)
    })
  }

  updateLaunchFilterResultCount(
    options.initialCount ?? countVisibleLaunchCards(),
  )
}

export function reapplyLaunchFilters(launches: Launch[]): void {
  applyLaunchFiltersFromDom(launches)
}

export function updateLaunchCardFilterAttributes(
  card: HTMLElement,
  launch: Launch,
  searchText: string,
  categorySlug: string,
): void {
  card.dataset.launchSearch = searchText
  card.dataset.launchStatus = launch.status
  card.dataset.launchSection = launch.section
  card.dataset.tokenCategorySlug = categorySlug
}

function applyLaunchFiltersFromDom(launches: Launch[]): void {
  const root = document.querySelector<HTMLElement>(
    '[data-launch-filters-root]',
  )

  if (!root) {
    return
  }

  filterState = readFilterStateFromDom(root)
  applyLaunchFilters(filterState, launches)
}

function readFilterStateFromDom(root: HTMLElement): LaunchFilterState {
  const searchInput = root.querySelector<HTMLInputElement>(
    '[data-launch-filter-search]',
  )
  const activeCategory = root.querySelector<HTMLElement>(
    '[data-launch-filter-category].launch-filter-chip--active',
  )
  const activeStatus = root.querySelector<HTMLElement>(
    '[data-launch-filter-status].launch-filter-chip--active',
  )

  return {
    query: searchInput?.value ?? '',
    category:
      (activeCategory?.getAttribute(
        'data-launch-filter-category',
      ) as LaunchFilterState['category']) ?? 'all',
    status:
      (activeStatus?.getAttribute(
        'data-launch-filter-status',
      ) as LaunchFilterState['status']) ?? 'all',
  }
}

function applyLaunchFilters(
  state: LaunchFilterState,
  _launches: Launch[],
): void {
  void _launches

  const filtersActive = isLaunchFilterActive(state)

  for (const card of document.querySelectorAll<HTMLElement>(
    '[data-token-card]',
  )) {
    const searchText = card.dataset.launchSearch ?? ''
    const categorySlug = card.dataset.tokenCategorySlug ?? 'other'
    const launchStatus = card.dataset.launchStatus ?? ''
    const launchSection = card.dataset.launchSection ?? ''

    const visible =
      matchesLaunchSearch(searchText, state.query) &&
      matchesLaunchCategoryFilter(categorySlug, state.category) &&
      matchesLaunchStatusFilter(launchStatus, launchSection, state.status)

    card.classList.toggle(FILTER_HIDDEN_CLASS, !visible)
  }

  for (const placeholder of document.querySelectorAll<HTMLElement>(
    '[data-launch-filter-placeholder]',
  )) {
    placeholder.classList.toggle(FILTER_HIDDEN_CLASS, filtersActive)
  }

  for (const section of document.querySelectorAll<HTMLElement>(
    '[data-launch-section]',
  )) {
    const sectionId = section.getAttribute('data-launch-section') ?? ''

    if (!LAUNCH_FILTER_SECTIONS.has(sectionId)) {
      section.classList.remove(SECTION_EMPTY_CLASS)
      continue
    }

    const visibleCards = section.querySelectorAll<HTMLElement>(
      `[data-token-card]:not(.${FILTER_HIDDEN_CLASS})`,
    )
    const visiblePlaceholders = section.querySelectorAll<HTMLElement>(
      `[data-launch-filter-placeholder]:not(.${FILTER_HIDDEN_CLASS})`,
    )

    section.classList.toggle(
      SECTION_EMPTY_CLASS,
      visibleCards.length === 0 && visiblePlaceholders.length === 0,
    )
  }

  updateLaunchFilterResultCount(countVisibleLaunchCards())
}

function matchesLaunchSearch(searchText: string, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return searchText.includes(normalizedQuery)
}

function matchesLaunchCategoryFilter(
  categorySlug: string,
  filter: LaunchFilterState['category'],
): boolean {
  if (filter === 'all') {
    return true
  }

  return categorySlug === filter
}

function matchesLaunchStatusFilter(
  launchStatus: string,
  launchSection: string,
  filter: LaunchFilterState['status'],
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

function setActiveChip(
  root: HTMLElement,
  kind: 'category' | 'status',
  value: string,
): void {
  for (const button of root.querySelectorAll<HTMLElement>(
    `[data-launch-filter-${kind}]`,
  )) {
    const isActive =
      button.getAttribute(`data-launch-filter-${kind}`) === value

    button.classList.toggle('launch-filter-chip--active', isActive)
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false')
  }
}

function countVisibleLaunchCards(): number {
  return document.querySelectorAll<HTMLElement>(
    `[data-token-card]:not(.${FILTER_HIDDEN_CLASS})`,
  ).length
}

function updateLaunchFilterResultCount(count: number): void {
  const element = document.querySelector<HTMLElement>(
    '[data-launch-filter-result-count]',
  )

  if (element) {
    element.textContent = formatLaunchFilterResultCount(count)
  }
}

export { FILTER_HIDDEN_CLASS }
