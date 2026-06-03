import type { Launch } from '../types/launch'
import { getSolscanTokenUrl } from '../config/urls'
import { getTokenDetailPath } from '../router'
import { escapeHtml } from '../utils/html'
import { isLocallyManagedLaunch } from '../services/submittedLaunchesStorage'
import { launchInfoAccordionId } from './launchCardAccordion'

function renderManageMenuItems(launch: Launch): string {
  const id = escapeHtml(launch.id)
  const mintAddress = escapeHtml(launch.mintAddress)
  const accordionId = escapeHtml(launchInfoAccordionId(launch.id))
  const items: string[] = []

  if (isLocallyManagedLaunch(launch)) {
    items.push(`
      <button
        type="button"
        class="launch-manage-menu__item"
        data-edit-launch="${id}"
      >
        Edit Launch
      </button>
      <button
        type="button"
        class="launch-manage-menu__item launch-manage-menu__item--danger"
        data-remove-launch="${id}"
      >
        Remove Launch
      </button>
    `)
  }

  items.push(`
    <button
      type="button"
      class="launch-manage-menu__item verify-mint-btn"
      data-verify-mint="${id}"
      data-mint-address="${mintAddress}"
    >
      Verify Mint
    </button>
    <button
      type="button"
      class="launch-manage-menu__item"
      data-open-accordion="${accordionId}"
    >
      Launch Info
    </button>
  `)

  return items.join('')
}

function renderManageMenu(launch: Launch): string {
  return `
    <details class="launch-manage-menu" data-launch-manage-menu>
      <summary class="launch-manage-menu__toggle">Manage</summary>
      <div class="launch-manage-menu__panel">
        ${renderManageMenuItems(launch)}
      </div>
    </details>
  `
}

/** Visitor actions plus collapsible manage menu for launch cards */
export function renderLaunchCardActions(launch: Launch): string {
  const detailPath = escapeHtml(getTokenDetailPath(launch.id))
  const viewTokenUrl = escapeHtml(getSolscanTokenUrl(launch.mintAddress))

  return `
    <div class="launch-card-actions">
      <div class="launch-card-actions__visitor">
        <a
          class="primary-btn"
          href="${viewTokenUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Token
        </a>
        <a class="secondary-btn" href="${detailPath}" data-router-link>
          View Details
        </a>
      </div>
      ${renderManageMenu(launch)}
    </div>
  `
}

/** @deprecated Use renderLaunchCardActions — kept for token detail page admin row */
export function renderLaunchAdminActions(launch: Launch): string {
  if (!isLocallyManagedLaunch(launch)) {
    return ''
  }

  const id = escapeHtml(launch.id)

  return `
    <div class="launch-admin-actions">
      <button
        type="button"
        class="secondary-btn"
        data-edit-launch="${id}"
      >
        Edit Launch
      </button>
      <button
        type="button"
        class="secondary-btn launch-admin-remove"
        data-remove-launch="${id}"
      >
        Remove Launch
      </button>
    </div>
  `
}
