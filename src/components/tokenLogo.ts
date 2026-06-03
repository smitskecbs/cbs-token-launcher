import type { Launch } from '../types/launch'
import { getLaunchDisplayName, getLaunchLogoFallback } from './applyLaunchCardMetadata'
import { escapeHtml } from '../utils/html'

export function renderTokenLogo(launch: Launch): string {
  const id = escapeHtml(launch.id)
  const name = escapeHtml(getLaunchDisplayName(launch))
  const fallback = escapeHtml(getLaunchLogoFallback(launch))

  if (launch.logo) {
    return `
      <img
        class="token-logo"
        src="${escapeHtml(launch.logo)}"
        alt="${name} logo"
        width="64"
        height="64"
      />
    `
  }

  return `
    <div class="token-logo-wrap" data-token-logo-wrap="${id}">
      <div
        class="token-icon token-icon--fallback"
        data-token-logo-fallback
        aria-hidden="true"
      >
        ${fallback}
      </div>
    </div>
  `
}
