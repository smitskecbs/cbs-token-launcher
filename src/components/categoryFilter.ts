import { categoryToFilterSlug } from '../utils/metadataCategory'

const HIDDEN_CLASS = 'is-category-hidden'

/**
 * Show or hide launch cards by metadata category slug.
 * Pass null to show all cards (future filter UI entry point).
 */
export function applyCategoryFilter(
  category: string | null,
): void {
  const cards = document.querySelectorAll<HTMLElement>('[data-token-card]')

  for (const card of cards) {
    if (!category) {
      card.classList.remove(HIDDEN_CLASS)
      continue
    }

    const cardSlug = card.getAttribute('data-token-category-slug')
    const targetSlug = categoryToFilterSlug(category)

    card.classList.toggle(HIDDEN_CLASS, cardSlug !== targetSlug)
  }
}

/** Read distinct category slugs currently present on launch cards */
export function getCategorySlugsFromPage(): string[] {
  const slugs = new Set<string>()

  for (const card of document.querySelectorAll('[data-token-card]')) {
    const slug = card.getAttribute('data-token-category-slug')

    if (slug) {
      slugs.add(slug)
    }
  }

  return [...slugs].sort()
}
