import type { Launch } from '../types/launch'
import type { HomepageSectionId } from '../types/homepage'
import {
  formatLaunchRankScore,
  getLaunchBadges,
  getVerificationSortPriority,
  type LaunchBadge,
} from '../services/launchRankingService'
import { escapeHtml } from '../utils/html'
import { renderLaunchVerifiedTrustBadge } from './launchVerifiedTrustPanel'

export function renderLaunchBadges(
  launch: Launch,
  homepageSection?: HomepageSectionId | null,
): string {
  const badges = getLaunchBadges(launch, {
    homepageSection,
  })

  if (badges.length === 0) {
    return '<div class="launch-badges" data-launch-badges hidden></div>'
  }

  return `
    <div class="launch-badges" data-launch-badges>
      ${badges.map((badge) => renderLaunchBadge(badge)).join('')}
    </div>
  `
}

export function renderFeaturedBadge(launch: Launch): string {
  if (launch.featured !== true) {
    return `
      <div class="token-detail-featured-badge" data-token-detail-featured hidden></div>
    `
  }

  return `
    <div class="token-detail-featured-badge" data-token-detail-featured>
      <span class="launch-badge launch-badge--featured">Featured</span>
    </div>
  `
}

export function renderVerificationBadge(launch: Launch): string {
  return renderLaunchVerifiedTrustBadge(launch)
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
  for (const root of getBadgeRoots(launchId)) {
    const homepageSection = readHomepageSection(root)
    const statusHtml = renderLaunchBadges(launch, homepageSection)
    const verificationHtml = renderVerificationBadge(launch)

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

function readHomepageSection(root: HTMLElement): HomepageSectionId | null {
  const value = root.dataset.homepageSection

  if (
    value === 'featured' ||
    value === 'listed' ||
    value === 'trending' ||
    value === 'new' ||
    value === 'upcoming' ||
    value === 'ecosystem'
  ) {
    return value
  }

  return null
}

function getBadgeRoots(launchId: string): HTMLElement[] {
  return [
    document.getElementById(`launch-${launchId}`),
    document.querySelector<HTMLElement>(
      `[data-token-detail="${launchId}"]`,
    ),
  ].filter((root): root is HTMLElement => root !== null)
}

export function reorderRankedSectionCards(section: HomepageSectionId): void {
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

export function updateSectionRankLabels(section: HomepageSectionId): void {
  const sectionElement = document.querySelector<HTMLElement>(
    `[data-launch-section="${section}"]`,
  )
  const cards = [
    ...(sectionElement?.querySelectorAll<HTMLElement>('.launch-card') ?? []),
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
