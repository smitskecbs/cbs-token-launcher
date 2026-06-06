import type { Launch } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import {
  formatMetadataSummaryLabel,
  getMetadataStatusSummary,
  METADATA_CHECK_COUNT,
} from '../utils/metadataStatusChecks'

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
  const card = document.getElementById(`launch-${launch.id}`)
  const element = card?.querySelector<HTMLElement>(
    '[data-launch-metadata-summary]',
  )

  if (!element) {
    return
  }

  const summary = getMetadataStatusSummary(launch, result)
  const className = getSummaryClassName(summary)

  element.className = className
  element.textContent = formatMetadataSummaryLabel(summary)
  element.setAttribute('aria-label', formatMetadataSummaryLabel(summary))
}

export { METADATA_CHECK_COUNT }
