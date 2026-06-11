import type { Launch } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import {
  formatMetadataSummaryLabel,
  getMetadataStatusSummary,
  METADATA_CHECK_COUNT,
} from '../utils/metadataStatusChecks'
import { forEachLaunchCardElement } from './launchCard'

function getSummaryClassName(
  summary: ReturnType<typeof getMetadataStatusSummary>,
): string {
  if (summary.kind === 'pending') {
    return 'launch-metadata-summary launch-metadata-summary--pending'
  }

  if (summary.passed === summary.total) {
    return 'launch-metadata-summary launch-metadata-summary--complete'
  }

  return 'launch-metadata-summary launch-metadata-summary--partial'
}

export function renderLaunchMetadataSummary(
  launch: Launch,
  result: ReadTokenMintResult | null = null,
): string {
  const summary = getMetadataStatusSummary(launch, result)
  const className = getSummaryClassName(summary)

  return `
    <p
      class="${className}"
      data-launch-metadata-summary
      aria-label="${formatMetadataSummaryLabel(summary)}"
    >
      ${formatMetadataSummaryLabel(summary)}
    </p>
  `
}

export function applyLaunchCardMetadataSummary(
  launch: Launch,
  result: ReadTokenMintResult | null,
): void {
  const summary = getMetadataStatusSummary(launch, result)
  const className = getSummaryClassName(summary)
  const label = formatMetadataSummaryLabel(summary)

  forEachLaunchCardElement(launch.id, (card) => {
    const element = card.querySelector<HTMLElement>(
      '[data-launch-metadata-summary]',
    )

    if (!element) {
      return
    }

    element.className = className
    element.textContent = label
    element.setAttribute('aria-label', label)
  })
}

export { METADATA_CHECK_COUNT }
