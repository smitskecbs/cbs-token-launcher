import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'
import { renderLaunchOfficialLinksPanel } from './officialLinks'
import { renderMarketStatusFields } from './marketStatusFields'
import { renderTokenCategoryField } from './tokenCategoryField'
import { renderTokenTagsPanel } from './tokenTagsField'

export function launchInfoPanelId(launchId: string): string {
  return `launch-info-${launchId}`
}

export function renderLaunchInfoPanel(
  launch: Launch,
  options: { embedded?: boolean } = {},
): string {
  const panelId = launchInfoPanelId(launch.id)
  const id = escapeHtml(launch.id)
  const info = launch.launchInfo
  const embedded = options.embedded ?? false
  const panelClass = embedded
    ? 'launch-info-panel launch-panel--embedded'
    : 'launch-info-panel'
  const heading = embedded
    ? ''
    : `
      <h4 class="launch-info-heading" id="launch-info-heading-${id}">
        Launch Info
      </h4>
    `

  return `
    <section
      class="${panelClass}"
      id="${escapeHtml(panelId)}"
      ${embedded ? '' : 'data-market-status-root'}
      aria-labelledby="launch-info-heading-${id}"
    >
      ${heading}
      <dl class="launch-info-details">
        <div class="launch-info-row">
          <dt>Launch Status</dt>
          <dd>${escapeHtml(info.launchStatus)}</dd>
        </div>
        ${
          embedded
            ? ''
            : renderMarketStatusFields({
                tradingStatus: info.tradingStatus,
                poolStatus: info.poolStatus,
              })
        }
        ${renderTokenCategoryField()}
        <div class="launch-info-row">
          <dt>Launch Date</dt>
          <dd>${escapeHtml(info.launchDate)}</dd>
        </div>
      </dl>
      ${renderTokenTagsPanel()}
      ${renderLaunchOfficialLinksPanel(launch)}
    </section>
  `
}

/** Market fields for the card Market Data accordion */
export function renderMarketDataPanel(launch: Launch): string {
  const info = launch.launchInfo

  return `
    <section class="launch-info-panel launch-panel--embedded">
      <dl class="launch-info-details">
        ${renderMarketStatusFields({
          tradingStatus: info.tradingStatus,
          poolStatus: info.poolStatus,
        })}
      </dl>
    </section>
  `
}
