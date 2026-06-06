import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'
import { renderLaunchAnalyticsPanel } from './launchAnalyticsPanel'
import { renderLaunchRiskPanel } from './launchRiskPanel'
import { renderMarketDataPanel } from './marketDataPanel'
import { renderTechnicalRiskNotice } from './technicalRiskNotice'
import { renderTokenCategoryField } from './tokenCategoryField'
import { renderTokenTagsPanel } from './tokenTagsField'
import { renderTokenDetailProjectInfo } from './tokenDetailProjectInfo'
import {
  renderTokenDetailAccordion,
  tokenDetailMarketAccordionId,
  tokenDetailMetadataAccordionId,
  tokenDetailTechnicalAccordionId,
} from './tokenDetailAccordion'

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
        <dt>On-chain Mint</dt>
        <dd>
          <code class="mint-address">${mintAddress}</code>
        </dd>
      </div>
      ${renderTokenCategoryField({ rowClass: 'token-detail-row' })}
      ${renderTokenTagsPanel()}
      <div class="token-detail-row token-detail-row--full">
        <dt>Metadata URI</dt>
        <dd class="verify-metadata-uri" data-token-metadata-uri>Not loaded yet</dd>
      </div>
      <div class="token-detail-row">
        <dt>Supply</dt>
        <dd data-token-supply>Not loaded yet</dd>
      </div>
      <div class="token-detail-row">
        <dt>Decimals</dt>
        <dd data-token-decimals>Not loaded yet</dd>
      </div>
      <div class="token-detail-row token-detail-row--full">
        <dt>Raw Metadata</dt>
        <dd
          class="verify-metadata-raw token-detail-metadata-raw"
          data-token-metadata-raw
        >Not loaded yet</dd>
      </div>
    </dl>
  `
}

export function renderTokenDetailSections(launch: Launch): string {
  return `
    ${renderTokenDetailProjectInfo(launch)}
    <div class="token-detail-accordions token-detail-accordions--secondary">
      ${renderTokenDetailAccordion(
        tokenDetailMarketAccordionId(launch.id),
        'Market Data',
        renderMarketSection(launch),
      )}
      ${renderTokenDetailAccordion(
        tokenDetailTechnicalAccordionId(launch.id),
        'Technical Checks',
        renderTechnicalSection(launch),
      )}
      ${renderTokenDetailAccordion(
        tokenDetailMetadataAccordionId(launch.id),
        'On-chain Metadata',
        renderMetadataSection(launch),
      )}
    </div>
  `
}
