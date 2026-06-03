import { escapeHtml } from '../utils/html'

export function renderLaunchAccordion(
  accordionId: string,
  title: string,
  content: string,
): string {
  const id = escapeHtml(accordionId)

  return `
    <details class="launch-accordion" id="${id}" data-launch-accordion>
      <summary class="launch-accordion-summary">${escapeHtml(title)}</summary>
      <div class="launch-accordion-body">
        ${content}
      </div>
    </details>
  `
}

export function openLaunchAccordion(accordionId: string): void {
  const accordion = document.getElementById(
    accordionId,
  ) as HTMLDetailsElement | null

  if (!accordion) {
    return
  }

  accordion.open = true
  accordion.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

export function launchInfoAccordionId(launchId: string): string {
  return `accordion-launch-info-${launchId}`
}

export function marketDataAccordionId(launchId: string): string {
  return `accordion-market-data-${launchId}`
}

export function launchAnalyticsAccordionId(launchId: string): string {
  return `accordion-analytics-${launchId}`
}

export function launchRiskAccordionId(launchId: string): string {
  return `accordion-risk-${launchId}`
}

export function metadataAccordionId(launchId: string): string {
  return `accordion-metadata-${launchId}`
}
