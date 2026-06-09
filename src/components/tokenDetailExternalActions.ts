import type { Launch } from '../types/launch'
import type { TokenMarketData } from '../types/tokenMarketData'
import { getJupiterSwapUrl, getSolscanTokenUrl } from '../config/urls'
import {
  renderDexscreenerAnchorHtml,
  resolveDexscreenerUrl,
} from '../utils/dexscreenerUrl'
import { escapeHtml } from '../utils/html'
import { isLaunchLiveForBuy } from '../utils/launchBuyLink'

const PRIMARY_BTN_CLASS = 'primary-btn token-detail-external-action-btn'

export function renderTokenDetailExternalActions(launch: Launch): string {
  const solscanUrl = escapeHtml(getSolscanTokenUrl(launch.mintAddress))
  const isLive = isLaunchLiveForBuy(launch)

  return `
    <div
      class="token-detail-external-actions"
      data-token-detail-external-actions
      aria-label="External links"
    >
      ${
        isLive
          ? `
        <div
          class="token-detail-external-action-slot"
          data-token-detail-external-dexscreener-slot
          hidden
        ></div>
        <div
          class="token-detail-external-action-slot"
          data-token-detail-external-jupiter-slot
          hidden
        ></div>
      `
          : ''
      }
      <a
        class="${PRIMARY_BTN_CLASS}"
        href="${solscanUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Solscan
      </a>
    </div>
  `
}

export function applyTokenDetailExternalActions(
  launch: Launch,
  data: TokenMarketData | null,
): void {
  if (!isLaunchLiveForBuy(launch)) {
    return
  }

  const root = document.querySelector<HTMLElement>(
    `[data-token-detail="${launch.id}"] [data-token-detail-external-actions]`,
  )

  if (!root) {
    return
  }

  const dexscreenerSlot = root.querySelector<HTMLElement>(
    '[data-token-detail-external-dexscreener-slot]',
  )
  const jupiterSlot = root.querySelector<HTMLElement>(
    '[data-token-detail-external-jupiter-slot]',
  )

  if (!data?.poolExists) {
    if (dexscreenerSlot) {
      dexscreenerSlot.innerHTML = ''
      dexscreenerSlot.hidden = true
    }

    if (jupiterSlot) {
      jupiterSlot.innerHTML = ''
      jupiterSlot.hidden = true
    }

    return
  }

  const dexscreenerUrl = resolveDexscreenerUrl(launch.mintAddress)

  if (dexscreenerSlot) {
    if (dexscreenerUrl) {
      dexscreenerSlot.innerHTML = renderDexscreenerAnchorHtml(
        dexscreenerUrl,
        'View on Dexscreener',
        PRIMARY_BTN_CLASS,
      )
      dexscreenerSlot.hidden = !dexscreenerSlot.innerHTML
    } else {
      dexscreenerSlot.innerHTML = ''
      dexscreenerSlot.hidden = true
    }
  }

  if (jupiterSlot) {
    const jupiterUrl = getJupiterSwapUrl(launch.mintAddress)

    jupiterSlot.innerHTML = `
      <a
        class="${PRIMARY_BTN_CLASS}"
        href="${escapeHtml(jupiterUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Buy on Jupiter
      </a>
    `
    jupiterSlot.hidden = false
  }
}
