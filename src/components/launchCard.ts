import type { Launch } from '../types/launch'
import {
  getLaunchDisplayDescription,
  getLaunchDisplayName,
  getLaunchDisplaySymbol,
} from './applyLaunchCardMetadata'
import { escapeHtml } from '../utils/html'
import { renderLaunchAnalyticsPanel } from './launchAnalyticsPanel'
import { renderLaunchRiskPanel } from './launchRiskPanel'
import { renderLaunchInfoPanel } from './launchInfoPanel'
import { renderMarketDataPanel } from './marketDataPanel'
import { renderLaunchCardActions } from './launchAdminActions'
import { renderTokenLogo } from './tokenLogo'
import { renderVerifyPanel } from './mintVerificationPanel'
import {
  renderLaunchBadges,
  renderLaunchRankMeta,
  renderVerificationBadge,
  getLaunchCardVerificationPriority,
} from './launchBadges'
import { getLaunchRankScore } from '../services/launchRankingService'
import { categoryToFilterSlug, DEFAULT_METADATA_CATEGORY } from '../utils/metadataCategory'
import {
  launchAnalyticsAccordionId,
  launchInfoAccordionId,
  launchRiskAccordionId,
  marketDataAccordionId,
  metadataAccordionId,
  renderLaunchAccordion,
} from './launchCardAccordion'
import { renderLaunchCardOverview } from './launchCardOverview'
import { renderTechnicalRiskNotice } from './technicalRiskNotice'

function renderLogo(launch: Launch): string {
  return renderTokenLogo(launch)
}

function renderMetadataAccordionContent(launch: Launch): string {
  const mintAddress = escapeHtml(launch.mintAddress)
  const showMintPanel =
    launch.status === 'preparing' ||
    launch.status === 'live' ||
    launch.status === 'ended'

  return `
    ${
      showMintPanel
        ? `
      <div class="mint-panel mint-panel--embedded">
        <span class="mint-label">Mint Address</span>
        <code class="mint-address">${mintAddress}</code>
      </div>
    `
        : ''
    }
    ${renderVerifyPanel(launch.id)}
  `
}

/** Reusable launch card — metadata fields update after Verify Mint */
export function renderLaunchCard(
  launch: Launch,
  sectionRank?: number,
): string {
  const id = escapeHtml(launch.id)
  const name = escapeHtml(getLaunchDisplayName(launch))
  const symbol = escapeHtml(getLaunchDisplaySymbol(launch))
  const description = escapeHtml(getLaunchDisplayDescription(launch))
  const score = getLaunchRankScore(launch)
  const verificationPriority = getLaunchCardVerificationPriority(launch)

  return `
    <article
      class="launch-card launch-card--link"
      id="launch-${id}"
      data-token-card="${id}"
      data-launch-rank-score="${score ?? 0}"
      data-launch-verification-priority="${verificationPriority}"
      data-token-category-slug="${escapeHtml(categoryToFilterSlug(DEFAULT_METADATA_CATEGORY))}"
      tabindex="0"
      role="link"
      aria-label="View ${name} details"
    >
      <div class="launch-card-overview">
        ${renderLaunchBadges(launch)}

        <div class="token-header">
          ${renderLogo(launch)}
          <div class="token-title-block">
            <h3 data-token-name>${name}</h3>
            ${renderVerificationBadge(launch)}
            ${renderLaunchRankMeta(sectionRank, score)}
            <p class="token-symbol" data-token-symbol>${symbol}</p>
          </div>
        </div>

        <div class="launch-details launch-details--compact">
          <p data-token-description>${description}</p>
        </div>

        ${renderLaunchCardOverview(launch.id)}
      </div>

      <div class="launch-card-accordions">
        ${renderLaunchAccordion(
          launchInfoAccordionId(launch.id),
          'Launch Info',
          renderLaunchInfoPanel(launch, { embedded: true }),
        )}
        ${renderLaunchAccordion(
          marketDataAccordionId(launch.id),
          'Market Data',
          renderMarketDataPanel(launch),
        )}
        ${renderLaunchAccordion(
          launchAnalyticsAccordionId(launch.id),
          'Analytics',
          renderLaunchAnalyticsPanel(launch.id, true),
        )}
        ${renderTechnicalRiskNotice(launch.id)}
        ${renderLaunchAccordion(
          launchRiskAccordionId(launch.id),
          'Technical Checks',
          renderLaunchRiskPanel(launch.id, true),
        )}
        ${renderLaunchAccordion(
          metadataAccordionId(launch.id),
          'Metadata / Mint Verification',
          renderMetadataAccordionContent(launch),
        )}
      </div>

      ${renderLaunchCardActions(launch)}
    </article>
  `
}

export function renderLaunchCardList(launches: Launch[]): string {
  if (launches.length === 0) {
    return ''
  }

  return `
    <div class="launch-card-list">
      ${launches
        .map((launch, index) => renderLaunchCard(launch, index + 1))
        .join('')}
    </div>
  `
}
