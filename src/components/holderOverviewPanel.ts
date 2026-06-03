import type { HolderOverviewResult } from '../types/holderOverview'
import {
  HOLDER_OVERVIEW_CHECKING,
  HOLDER_OVERVIEW_UNAVAILABLE,
} from '../types/holderOverview'
import { formatHolderPercent } from '../utils/formatHolderPercent'
import { escapeHtml } from '../utils/html'

const EMPTY_VALUE = '—'

export function holderOverviewPanelId(launchId: string): string {
  return `holder-overview-${launchId}`
}

export function renderHolderOverviewPanel(
  launchId: string,
  embedded = false,
): string {
  const id = escapeHtml(launchId)
  const panelClass = embedded
    ? 'holder-overview-panel launch-panel--embedded'
    : 'holder-overview-panel'

  return `
    <section
      class="${panelClass}"
      id="${holderOverviewPanelId(id)}"
      data-holder-overview-root
      aria-labelledby="holder-overview-heading-${id}"
    >
      <h5
        class="holder-overview-heading"
        id="holder-overview-heading-${id}"
      >
        Holder Overview
      </h5>
      <dl class="launch-info-details">
        <div class="launch-info-row">
          <dt>Holder Count</dt>
          <dd data-holder-count>${EMPTY_VALUE}</dd>
        </div>
        <div class="launch-info-row">
          <dt>Largest Holder %</dt>
          <dd data-holder-largest-percent>${EMPTY_VALUE}</dd>
        </div>
        <div class="launch-info-row">
          <dt>Top 10 Holders %</dt>
          <dd data-holder-top10-percent>${EMPTY_VALUE}</dd>
        </div>
        <div class="launch-info-row">
          <dt>Top 20 Holders %</dt>
          <dd data-holder-top20-percent>${EMPTY_VALUE}</dd>
        </div>
      </dl>
    </section>
  `
}

export function applyHolderOverview(
  launchId: string,
  result: HolderOverviewResult,
): void {
  for (const root of findHolderOverviewRoots(launchId)) {
    applyHolderOverviewToRoot(root, result)
  }
}

export function setHolderOverviewChecking(launchId: string): void {
  for (const root of findHolderOverviewRoots(launchId)) {
    setCheckingState(root)
  }
}

function findHolderOverviewRoots(launchId: string): HTMLElement[] {
  const roots: HTMLElement[] = []

  const panel = document.getElementById(holderOverviewPanelId(launchId))

  if (panel) {
    roots.push(panel)
  }

  const detailRoot = document.querySelector<HTMLElement>(
    `[data-token-detail="${launchId}"] [data-holder-overview-root]`,
  )

  if (detailRoot && !roots.includes(detailRoot)) {
    roots.push(detailRoot)
  }

  return roots
}

function applyHolderOverviewToRoot(
  root: HTMLElement,
  result: HolderOverviewResult,
): void {
  setText(
    root,
    '[data-holder-count]',
    formatHolderCount(result.holderCount),
  )
  setText(
    root,
    '[data-holder-largest-percent]',
    formatPercentValue(result.largestHolderPercent),
  )
  setText(
    root,
    '[data-holder-top10-percent]',
    formatPercentValue(result.top10HoldersPercent),
  )
  setText(
    root,
    '[data-holder-top20-percent]',
    formatPercentValue(result.top20HoldersPercent),
  )
}

function setCheckingState(root: HTMLElement): void {
  for (const selector of [
    '[data-holder-count]',
    '[data-holder-largest-percent]',
    '[data-holder-top10-percent]',
    '[data-holder-top20-percent]',
  ]) {
    setText(root, selector, HOLDER_OVERVIEW_CHECKING)
  }
}

function formatHolderCount(value: number | null): string {
  if (value === null) {
    return HOLDER_OVERVIEW_UNAVAILABLE
  }

  return value.toLocaleString('en-US')
}

function formatPercentValue(value: number | null): string {
  if (value === null) {
    return HOLDER_OVERVIEW_UNAVAILABLE
  }

  return formatHolderPercent(value)
}

function setText(
  root: HTMLElement,
  selector: string,
  value: string,
): void {
  const element = root.querySelector<HTMLElement>(selector)

  if (element) {
    element.textContent = value
  }
}
