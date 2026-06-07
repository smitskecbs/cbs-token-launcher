import type { Launch } from '../types/launch'
import {
  getLaunchDisplayName,
  getLaunchLogoFallback,
} from './applyLaunchCardMetadata'
import { escapeHtml } from '../utils/html'
import { resolveLaunchLogoUrl } from '../utils/resolveLaunchLogo'

export function renderTokenLogo(launch: Launch): string {
  const id = escapeHtml(launch.id)
  const name = escapeHtml(getLaunchDisplayName(launch))
  const fallback = escapeHtml(getLaunchLogoFallback(launch))
  const logoUrl = resolveLaunchLogoUrl(launch)

  if (logoUrl) {
    const src = escapeHtml(logoUrl)

    return `
      <div
        class="token-logo-wrap has-metadata-logo"
        data-token-logo-wrap="${id}"
      >
        <img
          class="token-logo"
          src="${src}"
          alt="${name} logo"
          width="64"
          height="64"
        />
        <div
          class="token-icon token-icon--fallback"
          data-token-logo-fallback
          aria-hidden="true"
          hidden
          style="display: none"
        >
          ${fallback}
        </div>
      </div>
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
