import { escapeHtml } from '../utils/html'

function noticeHeadingId(launchId?: string): string {
  return launchId
    ? `technical-risk-notice-heading-${launchId}`
    : 'technical-risk-notice-heading'
}

/** Shared disclaimer — Technical Risk is not investment advice */
export function renderTechnicalRiskNotice(launchId?: string): string {
  const headingId = escapeHtml(noticeHeadingId(launchId))

  return `
    <aside
      class="technical-risk-notice"
      data-technical-risk-notice
      aria-labelledby="${headingId}"
    >
      <p class="technical-risk-notice__title" id="${headingId}">
        IMPORTANT
      </p>
      <p class="technical-risk-notice__lead">
        Technical Risk only evaluates:
      </p>
      <ul class="technical-risk-notice__list">
        <li>metadata completeness</li>
        <li>authority status</li>
        <li>mint verification</li>
        <li>pool detection</li>
      </ul>
      <p class="technical-risk-notice__lead">
        It does <strong>not</strong> evaluate:
      </p>
      <ul class="technical-risk-notice__list">
        <li>investment risk</li>
        <li>market risk</li>
        <li>holder concentration</li>
        <li>liquidity strength</li>
        <li>future price performance</li>
      </ul>
      <p class="technical-risk-notice__footer">
        Always do your own research.
      </p>
    </aside>
  `
}

export function renderTechnicalRiskInfoIcon(launchId?: string): string {
  const id = escapeHtml(noticeHeadingId(launchId))

  return `
    <button
      type="button"
      class="technical-risk-info-btn"
      data-technical-risk-info
      aria-label="About Technical Risk"
      aria-describedby="${id}"
      title="Technical Risk checks metadata, authorities, mint verification, and pool detection only. It does not evaluate investment or market risk."
    >
      <span class="technical-risk-info-icon" aria-hidden="true">i</span>
    </button>
  `
}
