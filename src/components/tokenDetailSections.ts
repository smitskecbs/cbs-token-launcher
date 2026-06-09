import type { Launch } from '../types/launch'
import { renderLaunchAnalyticsPanel } from './launchAnalyticsPanel'
import { renderLaunchRiskPanel } from './launchRiskPanel'
import { renderTechnicalRiskNotice } from './technicalRiskNotice'
import { renderLaunchVerifiedTrustPanel } from './launchVerifiedTrustPanel'
import {
  renderTokenDetailMarketOverview,
} from './tokenDetailMarketOverview'
import {
  renderTokenDetailPriceChart,
} from './tokenDetailPriceChart'
import {
  renderTokenDetailProjectHeader,
  renderTokenDetailProjectInfo,
} from './tokenDetailProjectInfo'
import { renderTokenDetailProjectTimeline } from './tokenDetailProjectTimeline'
import { renderTokenDetailMetadataPanel } from './tokenDetailMetadataPanel'
import {
  renderTokenDetailAccordion,
  tokenDetailMetadataAccordionId,
  tokenDetailTechnicalAccordionId,
} from './tokenDetailAccordion'

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
    <section class="token-detail-section token-detail-project-header-wrap">
      ${renderTokenDetailProjectHeader(launch)}
    </section>
    ${renderTokenDetailMarketOverview(launch)}
    ${renderTokenDetailPriceChart(launch)}
    ${renderLaunchVerifiedTrustPanel(launch)}
    ${renderTokenDetailProjectInfo(launch)}
    ${renderTokenDetailProjectTimeline(launch)}
  `
}

export function renderTokenDetailAccordionSections(launch: Launch): string {
  return `
    <div class="token-detail-accordions token-detail-accordions--secondary">
      ${renderTokenDetailAccordion(
        tokenDetailMetadataAccordionId(launch.id),
        'Metadata Status',
        renderMetadataSection(launch),
      )}
      ${renderTokenDetailAccordion(
        tokenDetailTechnicalAccordionId(launch.id),
        'Technical Checks',
        renderTechnicalSection(launch),
      )}
    </div>
  `
}
