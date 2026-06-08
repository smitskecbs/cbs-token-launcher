import type { Launch } from '../types/launch'
import {
  getLaunchVerificationLevel,
  getVerificationBadge,
} from '../services/launchRankingService'
import { escapeHtml } from '../utils/html'

const PUBLIC_VERIFIED_CHECKS = [
  'Mint address verified',
  'Metadata reviewed',
  'Logo available',
  'Description completed',
  'At least one official project link',
  'Project page completed',
] as const

export function isLaunchTrustVerified(launch: Launch): boolean {
  const level = getLaunchVerificationLevel(launch)

  return level === 'verified' || level === 'cbs-verified'
}

export function renderLaunchVerifiedTrustBadge(launch: Launch): string {
  const badge = getVerificationBadge(launch)

  if (!badge || !isLaunchTrustVerified(launch)) {
    return `
      <div class="launch-verification-badge" data-launch-verification-badge hidden></div>
    `
  }

  const label = escapeHtml(badge.label)

  return `
    <div class="launch-verification-badge" data-launch-verification-badge>
      <details class="launch-verified-trust launch-verified-trust--compact">
        <summary class="launch-verified-trust__summary">
          <span class="launch-badge launch-badge--${escapeHtml(badge.id)}">
            ${label}
          </span>
          <span class="launch-verified-trust__info" aria-hidden="true">ⓘ</span>
        </summary>
        <div class="launch-verified-trust__panel">
          <p class="launch-verified-trust__lead">
            Verified by CBS Launcher. This project has been manually reviewed.
          </p>
        </div>
      </details>
    </div>
  `
}

export function renderLaunchVerifiedTrustPanel(launch: Launch): string {
  if (!isLaunchTrustVerified(launch)) {
    return `
      <div class="launch-verified-trust-block" data-launch-verified-trust hidden></div>
    `
  }

  return `
    <div class="launch-verified-trust-block" data-launch-verified-trust>
      <details class="launch-verified-trust launch-verified-trust--detail">
        <summary class="launch-verified-trust__summary launch-verified-trust__summary--detail">
          <span class="launch-verified-trust__title">
            ✓ Verified by CBS Launcher
          </span>
          <span class="launch-verified-trust__info" aria-hidden="true">ⓘ</span>
        </summary>
        <div class="launch-verified-trust__panel">
          <p class="launch-verified-trust__lead">
            This project has passed manual review.
          </p>
          <p class="launch-verified-trust__sublead">
            Checks may include:
          </p>
          <ul class="launch-verified-trust__checks">
            ${PUBLIC_VERIFIED_CHECKS.map(
              (item) => `
                <li class="launch-verified-trust__check">
                  <span aria-hidden="true">✓</span>
                  ${escapeHtml(item)}
                </li>
              `,
            ).join('')}
          </ul>
        </div>
      </details>
    </div>
  `
}
