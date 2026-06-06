import type { Launch } from '../types/launch'
import { renderLaunchAnalyticsPanel } from './launchAnalyticsPanel'
import { renderLaunchRiskPanel } from './launchRiskPanel'
import { renderMarketDataPanel } from './marketDataPanel'
import { renderTechnicalRiskNotice } from './technicalRiskNotice'
import { renderTokenDetailProjectInfo } from './tokenDetailProjectInfo'
import { renderTokenDetailLaunchUpdates } from './tokenDetailLaunchUpdates'
import { renderTokenDetailMetadataPanel } from './tokenDetailMetadataPanel'
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
  return renderTokenDetailMetadataPanel(launch)
}

export function renderTokenDetailSections(launch: Launch): string {
  return `
    ${renderTokenDetailProjectInfo(launch)}
    ${renderTokenDetailLaunchUpdates(launch)}
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
        'Metadata Status',
        renderMetadataSection(launch),
      )}
    </div>
  `
}
