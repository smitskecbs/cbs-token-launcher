import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'

const CBS_COIN_POOL_DEBUG_LABELS = [
  'View Pool',
  'Dexscreener',
  'Trade on Raydium',
] as const

type PoolDebugLabel = (typeof CBS_COIN_POOL_DEBUG_LABELS)[number]

function findPoolActionLink(
  actionsRoot: HTMLElement,
  label: PoolDebugLabel,
): HTMLAnchorElement | null {
  for (const anchor of actionsRoot.querySelectorAll<HTMLAnchorElement>('a')) {
    if (anchor.textContent?.trim() === label) {
      return anchor
    }
  }

  return null
}

function renderLiveDomDebugPanel(
  anchor: HTMLAnchorElement,
  label: PoolDebugLabel,
): string {
  return `
    <p class="token-detail-pool-live-debug__title">${escapeHtml(label)}</p>
    <p>tagName: ${escapeHtml(anchor.tagName)}</p>
    <p>href attribute: ${escapeHtml(anchor.getAttribute('href') ?? '(null)')}</p>
    <p>href property: ${escapeHtml(anchor.href)}</p>
    <p>target: ${escapeHtml(anchor.target || '(empty)')}</p>
    <p>rel: ${escapeHtml(anchor.rel || '(empty)')}</p>
    <pre class="token-detail-pool-live-debug__html">${escapeHtml(anchor.outerHTML)}</pre>
  `
}

function attachPoolActionClickDebug(
  anchor: HTMLAnchorElement,
  label: PoolDebugLabel,
): void {
  anchor.addEventListener('click', (event) => {
    console.log('[external-click-debug]', {
      label,
      tagName: anchor.tagName,
      attrHref: anchor.getAttribute('href'),
      href: anchor.href,
      target: anchor.target,
      rel: anchor.rel,
      defaultPrevented: event.defaultPrevented,
      outerHTML: anchor.outerHTML,
    })

    setTimeout(() => {
      console.log('[external-click-after]', window.location.href)
    }, 0)
  })
}

function clearPoolLiveDebugPanels(root: ParentNode): void {
  for (const panel of root.querySelectorAll('[data-pool-live-debug-panel]')) {
    panel.remove()
  }
}

export function attachCbsCoinPoolExternalLinkDebug(launch: Launch): void {
  if (launch.id !== 'cbs-coin') {
    return
  }

  const poolBody = document.querySelector<HTMLElement>(
    '[data-token-detail-pool-launch="cbs-coin"] [data-token-detail-pool-body]',
  )

  if (!poolBody) {
    return
  }

  const actionsRoot = poolBody.querySelector<HTMLElement>(
    '[data-token-detail-pool-actions]',
  )

  if (!actionsRoot) {
    clearPoolLiveDebugPanels(poolBody)
    return
  }

  clearPoolLiveDebugPanels(poolBody)

  for (const label of CBS_COIN_POOL_DEBUG_LABELS) {
    const anchor = findPoolActionLink(actionsRoot, label)

    if (!anchor) {
      continue
    }

    const panel = document.createElement('div')
    panel.className = 'token-detail-pool-live-debug'
    panel.setAttribute('data-pool-live-debug-panel', label)
    panel.innerHTML = renderLiveDomDebugPanel(anchor, label)
    anchor.insertAdjacentElement('afterend', panel)
    attachPoolActionClickDebug(anchor, label)
  }
}
