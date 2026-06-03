import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'
import {
  formatLaunchRankScore,
  getLaunchBadges,
  getVerificationBadge,
  getVerificationSortPriority,
  isLaunchVerified,
  type LaunchBadge,
} from '../services/launchRankingService'
import { getCachedMintVerification } from '../services/mintVerificationCache'

export function renderLaunchBadges(launch: Launch): string {
  const badges = getLaunchBadges(launch)

  if (badges.length === 0) {
    return '<div class="launch-badges" data-launch-badges hidden></div>'
  }

  return `
    <div class="launch-badges" data-launch-badges>
      ${badges.map((badge) => renderLaunchBadge(badge)).join('')}
    </div>
  `
}

export function renderVerificationBadge(launch: Launch): string {
  const mintResult = getCachedMintVerification(launch.mintAddress)
  const chainVerified = isLaunchVerified(mintResult)
  const badge = getVerificationBadge(launch, chainVerified)

  if (!badge) {
    return `
      <div class="launch-verification-badge" data-launch-verification-badge hidden></div>
    `
  }

  return `
    <div class="launch-verification-badge" data-launch-verification-badge>
      ${renderLaunchBadge(badge)}
    </div>
  `
}

function renderLaunchBadge(badge: LaunchBadge): string {
  return `
    <span class="launch-badge launch-badge--${escapeHtml(badge.id)}">
      ${escapeHtml(badge.label)}
    </span>
  `
}

export function renderLaunchRankMeta(
  sectionRank?: number,
  score: number | null = null,
): string {
  const rankLabel =
    sectionRank && sectionRank > 0
      ? `Rank #${sectionRank}`
      : 'Rank —'
  const scoreLabel = formatLaunchRankScore(score)

  return `
    <div class="launch-rank-meta" data-launch-rank-meta>
      <span class="launch-rank-label" data-launch-rank-label>
        ${escapeHtml(rankLabel)}
      </span>
      <span class="launch-rank-score" data-launch-rank-score>
        ${escapeHtml(scoreLabel)}
      </span>
    </div>
  `
}

export function applyLaunchBadges(launchId: string, launch: Launch): void {
  const statusHtml = renderLaunchBadges(launch)
  const verificationHtml = renderVerificationBadge(launch)

  for (const root of getBadgeRoots(launchId)) {
    const statusContainer = root.querySelector<HTMLElement>(
      '[data-launch-badges]',
    )

    if (statusContainer) {
      statusContainer.outerHTML = statusHtml
    }

    const verificationContainer = root.querySelector<HTMLElement>(
      '[data-launch-verification-badge]',
    )

    if (verificationContainer) {
      verificationContainer.outerHTML = verificationHtml
    }
  }
}

export function applyLaunchRankDisplay(
  launchId: string,
  sectionRank: number | null,
  score: number | null,
): void {
  const rankLabel =
    sectionRank && sectionRank > 0
      ? `Rank #${sectionRank}`
      : 'Rank —'
  const scoreLabel = formatLaunchRankScore(score)

  for (const root of getBadgeRoots(launchId)) {
    const rankElement = root.querySelector<HTMLElement>(
      '[data-launch-rank-label]',
    )
    const scoreElement = root.querySelector<HTMLElement>(
      '[data-launch-rank-score]',
    )

    if (rankElement) {
      rankElement.textContent = rankLabel
    }

    if (scoreElement) {
      scoreElement.textContent = scoreLabel
    }
  }
}

function getBadgeRoots(launchId: string): HTMLElement[] {
  return [
    document.getElementById(`launch-${launchId}`),
    document.querySelector<HTMLElement>(
      `[data-token-detail="${launchId}"]`,
    ),
  ].filter((root): root is HTMLElement => root !== null)
}

export function reorderRankedSectionCards(section: string): void {
  const sectionElement = document.querySelector<HTMLElement>(
    `[data-launch-section="${section}"]`,
  )
  const list = sectionElement?.querySelector<HTMLElement>(
    '.launch-card-list',
  )

  if (!list) {
    return
  }

  const cards = [...list.querySelectorAll<HTMLElement>('.launch-card')]

  cards.sort((left, right) => {
    const leftVerification = Number(
      left.dataset.launchVerificationPriority ?? 0,
    )
    const rightVerification = Number(
      right.dataset.launchVerificationPriority ?? 0,
    )

    if (rightVerification !== leftVerification) {
      return rightVerification - leftVerification
    }

    const leftScore = Number(left.dataset.launchRankScore ?? 0)
    const rightScore = Number(right.dataset.launchRankScore ?? 0)

    return rightScore - leftScore
  })

  for (const card of cards) {
    list.appendChild(card)
  }

  updateSectionRankLabels(section)
}

export function updateSectionRankLabels(section: string): void {
  const sectionElement = document.querySelector<HTMLElement>(
    `[data-launch-section="${section}"]`,
  )
  const cards = [
    ...sectionElement?.querySelectorAll<HTMLElement>('.launch-card') ?? [],
  ]

  cards.forEach((card, index) => {
    const launchId = card.getAttribute('data-token-card')

    if (!launchId) {
      return
    }

    const scoreValue = card.dataset.launchRankScore
    const score =
      scoreValue === undefined || scoreValue === ''
        ? null
        : Number(scoreValue)

    applyLaunchRankDisplay(
      launchId,
      index + 1,
      Number.isNaN(score) ? null : score,
    )
  })
}

export function getLaunchCardVerificationPriority(launch: Launch): number {
  return getVerificationSortPriority(launch)
}
