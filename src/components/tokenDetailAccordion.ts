import { escapeHtml } from '../utils/html'

export function tokenDetailOverviewAccordionId(launchId: string): string {
  return `token-detail-overview-${launchId}`
}

export function tokenDetailMarketAccordionId(launchId: string): string {
  return `token-detail-market-${launchId}`
}

export function tokenDetailTechnicalAccordionId(launchId: string): string {
  return `token-detail-technical-${launchId}`
}

export function tokenDetailMetadataAccordionId(launchId: string): string {
  return `token-detail-metadata-${launchId}`
}

export function renderTokenDetailAccordion(
  accordionId: string,
  title: string,
  content: string,
  open = false,
): string {
  const id = escapeHtml(accordionId)
  const openAttr = open ? ' open' : ''

  return `
    <details
      class="token-detail-accordion"
      id="${id}"
      data-token-detail-accordion${openAttr}
    >
      <summary class="token-detail-accordion__summary">${escapeHtml(title)}</summary>
      <div class="token-detail-accordion__body">
        ${content}
      </div>
    </details>
  `
}
