import type { Launch } from '../types/launch'
import {
  catalogLinksToMetadataLinks,
  getLaunchOfficialLinks,
  renderDetailLinksContent,
} from './officialLinks'
import { renderVerificationBadge } from './launchBadges'
import { renderTokenLogo } from './tokenLogo'
import { escapeHtml } from '../utils/html'
import {
  getDetailPageDescription,
  getDetailPageName,
  getDetailPageSymbol,
  getLaunchDetailStatusClass,
  getLaunchDetailStatusLabel,
  getLaunchListedDateDisplay,
} from '../utils/launchDetailDisplay'
function renderDetailLinksSection(launch: Launch): string {
  const links = catalogLinksToMetadataLinks(getLaunchOfficialLinks(launch))

  return `
    <div class="token-detail-links" data-token-detail-links>
      ${renderDetailLinksContent(links)}
    </div>
  `
}

export function renderTokenDetailProjectInfo(launch: Launch): string {
  const id = escapeHtml(launch.id)
  const name = escapeHtml(getDetailPageName(launch))
  const symbol = escapeHtml(getDetailPageSymbol(launch))
  const description = escapeHtml(getDetailPageDescription(launch))
  const mintAddress = escapeHtml(launch.mintAddress)
  const statusLabel = getLaunchDetailStatusLabel(launch)
  const statusClass = getLaunchDetailStatusClass(statusLabel)
  const listedDateDisplay = getLaunchListedDateDisplay(launch)
  const listedDateMarkup = listedDateDisplay
    ? `<p class="token-detail-listed-date">${escapeHtml(listedDateDisplay)}</p>`
    : ''

  return `
    <section
      class="token-detail-section token-detail-project"
      data-token-detail-project
    >
      <div class="token-header token-header--detail token-header--detail-section">
        ${renderTokenLogo(launch)}
        <div class="token-title-block">
          <span
            class="token-detail-status-badge ${statusClass}"
            data-token-detail-status
          >
            ${escapeHtml(statusLabel)}
          </span>
          <h1 data-token-name>${name}</h1>
          ${renderVerificationBadge(launch)}
          <p class="token-symbol" data-token-symbol>${symbol}</p>
          ${listedDateMarkup}
        </div>
      </div>

      <div class="token-detail-project-description">
        <h2 class="token-detail-heading">About</h2>
        <p data-token-description>${description}</p>
      </div>

      <dl class="token-detail-details token-detail-project-details">
        <div class="token-detail-row token-detail-row--full">
          <dt>Mint Address</dt>
          <dd class="token-detail-mint-copy">
            <code
              class="mint-address"
              data-token-mint-address
            >${mintAddress}</code>
            <button
              type="button"
              class="secondary-btn token-detail-copy-btn"
              data-copy-token-mint="${id}"
            >
              Copy
            </button>
            <p
              class="token-detail-copy-confirm"
              data-copy-mint-confirm
              hidden
              aria-live="polite"
            >
              Mint address copied.
            </p>
          </dd>
        </div>
        ${renderDetailLinksSection(launch)}
      </dl>

      <p
        class="token-chain-status"
        data-token-chain-status
        aria-live="polite"
        hidden
      ></p>
    </section>
  `
}

export function attachTokenDetailProjectInfo(launch: Launch): void {
  const button = document.querySelector<HTMLButtonElement>(
    `[data-copy-token-mint="${launch.id}"]`,
  )
  const confirm = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"] [data-copy-mint-confirm]`,
  )
  const mintElement = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"] [data-token-mint-address]`,
  )

  if (!button || !confirm || !mintElement) {
    return
  }

  let confirmTimeoutId: number | undefined

  button.addEventListener('click', () => {
    void copyMintAddress(mintElement.textContent?.trim() ?? launch.mintAddress, confirm, () => {
      if (confirmTimeoutId !== undefined) {
        window.clearTimeout(confirmTimeoutId)
      }

      confirmTimeoutId = window.setTimeout(() => {
        confirm.hidden = true
        confirm.textContent = 'Mint address copied.'
      }, 2400)
    })
  })
}

async function copyMintAddress(
  mintAddress: string,
  confirm: HTMLElement,
  onShown: () => void,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(mintAddress)
    confirm.hidden = false
    confirm.textContent = 'Mint address copied.'
    onShown()
  } catch {
    confirm.hidden = false
    confirm.textContent = 'Copy failed. Select the mint address and copy manually.'
    onShown()
  }
}
