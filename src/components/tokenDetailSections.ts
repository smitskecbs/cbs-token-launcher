import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'
import {
  getLaunchDisplayDescription,
  getLaunchDisplayName,
  getLaunchDisplaySymbol,
} from './applyLaunchCardMetadata'
import { renderLaunchAnalyticsPanel } from './launchAnalyticsPanel'
import { renderLaunchRiskPanel } from './launchRiskPanel'
import { renderLaunchOfficialLinksPanel } from './officialLinks'
import {
  renderLaunchBadges,
  renderLaunchRankMeta,
  renderVerificationBadge,
} from './launchBadges'
import { renderMarketDataPanel } from './marketDataPanel'
import { renderTokenCategoryField } from './tokenCategoryField'
import { renderTokenTagsPanel } from './tokenTagsField'
import { renderTokenLogo } from './tokenLogo'
import { renderTechnicalRiskNotice } from './technicalRiskNotice'
import {
  renderTokenDetailAccordion,
  tokenDetailMarketAccordionId,
  tokenDetailMetadataAccordionId,
  tokenDetailOverviewAccordionId,
  tokenDetailTechnicalAccordionId,
} from './tokenDetailAccordion'
import { getLaunchRankScore } from '../services/launchRankingService'

function renderOverviewSection(
  launch: Launch,
  sectionRank: number,
): string {
  const name = escapeHtml(getLaunchDisplayName(launch))
  const symbol = escapeHtml(getLaunchDisplaySymbol(launch))
  const description = escapeHtml(getLaunchDisplayDescription(launch))
  const score = getLaunchRankScore(launch)

  return `
    ${renderLaunchBadges(launch)}

    <div class="token-header token-header--detail token-header--detail-section">
      ${renderTokenLogo(launch)}
      <div class="token-title-block">
        <h1 data-token-name>${name}</h1>
        ${renderVerificationBadge(launch)}
        ${renderLaunchRankMeta(sectionRank, score)}
        <p class="token-symbol" data-token-symbol>${symbol}</p>
      </div>
    </div>

    <div class="launch-details token-detail-overview-description">
      <p data-token-description>${description}</p>
    </div>

    <dl class="token-detail-details">
      ${renderTokenCategoryField({ rowClass: 'token-detail-row' })}
    </dl>

    ${renderTokenTagsPanel()}

    ${renderLaunchOfficialLinksPanel(launch)}

    <p
      class="token-chain-status"
      data-token-chain-status
      aria-live="polite"
      hidden
    ></p>
  `
}

function renderMarketSection(launch: Launch): string {
  return renderMarketDataPanel(launch)
}

function renderTechnicalSection(launch: Launch): string {
  return `
    ${renderTechnicalRiskNotice(launch.id)}
    <div class="token-detail-tech-panels">
      <div data-launch-analytics-root>
        ${renderLaunchAnalyticsPanel(launch.id, true)}
      </div>
      <div data-launch-risk-root>
        ${renderLaunchRiskPanel(launch.id, true)}
      </div>
    </div>
  `
}

function renderMetadataSection(launch: Launch): string {
  const mintAddress = escapeHtml(launch.mintAddress)

  return `
    <dl class="token-detail-details">
      <div class="token-detail-row token-detail-row--full">
        <dt>Mint Address</dt>
        <dd>
          <code class="mint-address">${mintAddress}</code>
        </dd>
      </div>
      <div class="token-detail-row token-detail-row--full">
        <dt>Metadata URI</dt>
        <dd class="verify-metadata-uri" data-token-metadata-uri>—</dd>
      </div>
      <div class="token-detail-row">
        <dt>Supply</dt>
        <dd data-token-supply>—</dd>
      </div>
      <div class="token-detail-row">
        <dt>Decimals</dt>
        <dd data-token-decimals>—</dd>
      </div>
      <div class="token-detail-row token-detail-row--full">
        <dt>Raw Metadata</dt>
        <dd
          class="verify-metadata-raw token-detail-metadata-raw"
          data-token-metadata-raw
        >—</dd>
      </div>
    </dl>
  `
}

export function renderTokenDetailSections(
  launch: Launch,
  sectionRank: number,
): string {
  return `
    <div class="token-detail-accordions">
      ${renderTokenDetailAccordion(
        tokenDetailOverviewAccordionId(launch.id),
        'Overview',
        renderOverviewSection(launch, sectionRank),
        true,
      )}
      ${renderTokenDetailAccordion(
        tokenDetailMarketAccordionId(launch.id),
        'Market',
        renderMarketSection(launch),
      )}
      ${renderTokenDetailAccordion(
        tokenDetailTechnicalAccordionId(launch.id),
        'Technical Checks',
        renderTechnicalSection(launch),
      )}
      ${renderTokenDetailAccordion(
        tokenDetailMetadataAccordionId(launch.id),
        'Metadata',
        renderMetadataSection(launch),
      )}
    </div>
  `
}
