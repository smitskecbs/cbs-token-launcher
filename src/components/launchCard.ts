import type { Launch } from '../types/launch'
import type { HomepageSectionId } from '../types/homepage'
import {
  getLaunchDisplayDescription,
  getLaunchDisplayName,
  getLaunchDisplaySymbol,
} from './applyLaunchCardMetadata'
import { escapeHtml } from '../utils/html'
import { renderTokenLogo } from './tokenLogo'
import {
  renderVerificationBadge,
  getLaunchCardVerificationPriority,
} from './launchBadges'
import { getLaunchRankScore } from '../services/launchRankingService'
import {
  buildLaunchSearchText,
  getLaunchFilterCategorySlug,
} from '../services/launchFilterService'
import { renderLaunchMetadataSummary } from './launchCardMetadataSummary'
import { getCachedMintVerification } from '../services/mintVerificationCache'
import { renderDiscoveryCardActions } from './launchDiscoveryCardActions'
import { renderDiscoveryStatusBadge } from './launchDiscoveryStatusBadge'

/** Compact homepage discovery card — deep analysis lives on the token detail page */
export function getTrendingLaunchCardInstanceId(launchId: string): string {
  return `${launchId}--trending`
}

export function getLaunchCardInstanceIds(launchId: string): string[] {
  return [launchId, getTrendingLaunchCardInstanceId(launchId)]
}

export function renderLaunchCard(
  launch: Launch,
  options: {
    sectionRank?: number
    homepageSection?: HomepageSectionId | null
    cardInstanceId?: string
  } = {},
): string {
  const homepageSection = options.homepageSection ?? null
  const cardInstanceId = options.cardInstanceId ?? launch.id
  const id = escapeHtml(cardInstanceId)
  const name = escapeHtml(getLaunchDisplayName(launch))
  const symbol = escapeHtml(getLaunchDisplaySymbol(launch))
  const description = escapeHtml(getLaunchDisplayDescription(launch))
  const score = getLaunchRankScore(launch)
  const verificationPriority = getLaunchCardVerificationPriority(launch)
  const searchText = escapeHtml(buildLaunchSearchText(launch))
  const categorySlug = escapeHtml(getLaunchFilterCategorySlug(launch))
  const cachedMintResult = getCachedMintVerification(launch.mintAddress)

  return `
    <article
      class="launch-card launch-card--link launch-card--discovery"
      id="launch-${id}"
      data-token-card="${id}"
      data-launch-rank-score="${score ?? 0}"
      data-launch-verification-priority="${verificationPriority}"
      data-launch-search="${searchText}"
      data-launch-status="${escapeHtml(launch.status)}"
      data-launch-section="${escapeHtml(launch.section)}"
      data-token-category-slug="${categorySlug}"
      ${homepageSection ? `data-homepage-section="${escapeHtml(homepageSection)}"` : ''}
      tabindex="0"
      role="link"
      aria-label="View ${name} details"
    >
      <div class="launch-discovery-card">
        <div class="launch-discovery-card__header">
          ${renderTokenLogo(launch)}
          <div class="token-title-block">
            <h3 data-token-name>${name}</h3>
            ${renderVerificationBadge(launch)}
            <p class="token-symbol" data-token-symbol>${symbol}</p>
          </div>
        </div>

        ${renderDiscoveryStatusBadge(launch)}

        <div class="launch-details launch-details--compact">
          <p data-token-description>${description}</p>
          ${renderLaunchMetadataSummary(launch, cachedMintResult)}
        </div>

        ${renderDiscoveryCardActions(launch)}
      </div>
    </article>
  `
}

export function renderLaunchCardList(
  launches: Launch[],
  homepageSection?: HomepageSectionId,
): string {
  if (launches.length === 0) {
    return ''
  }

  return `
    <div class="launch-card-list">
      ${launches
        .map((launch, index) =>
          renderLaunchCard(launch, {
            sectionRank: index + 1,
            homepageSection,
            cardInstanceId:
              homepageSection === 'trending'
                ? getTrendingLaunchCardInstanceId(launch.id)
                : launch.id,
          }),
        )
        .join('')}
    </div>
  `
}
