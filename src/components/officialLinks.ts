import type { ReadTokenMintResult } from '../solana/verifyMint'
import type { Launch, OfficialLinks } from '../types/launch'
import {
  hasMetadataSocialLinks,
  mergeSocialLinksPrimaryMetadata,
  type MetadataSocialLinkKey,
  type MetadataSocialLinks,
} from '../utils/metadataFields'
import { escapeHtml } from '../utils/html'

const OFFICIAL_LINK_ORDER: MetadataSocialLinkKey[] = [
  'website',
  'telegram',
  'twitter',
  'discord',
  'facebook',
  'github',
]

const OFFICIAL_LINK_LABELS: Record<MetadataSocialLinkKey, string> = {
  website: 'Website',
  telegram: 'Telegram',
  twitter: 'X (Twitter)',
  discord: 'Discord',
  facebook: 'Facebook',
  github: 'GitHub',
}

const OFFICIAL_LINK_ICONS: Record<MetadataSocialLinkKey, string> = {
  website: `
    <svg class="official-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm7.93 9h-3.18a15.6 15.6 0 0 0-1.07-4.03A8.03 8.03 0 0 1 19.93 11ZM12 4c.95 1.6 1.58 3.47 1.82 5.5H10.18C10.42 7.47 11.05 5.6 12 4ZM8.32 6.97A15.6 15.6 0 0 0 7.25 11H4.07a8.03 8.03 0 0 1 4.25-4.03ZM4.07 13h3.18c.22 1.45.6 2.82 1.07 4.03A8.03 8.03 0 0 1 4.07 13Zm5.11 7.03c-.47-1.21-.85-2.58-1.07-4.03h3.64c-.24 2.03-.87 3.9-1.82 5.5a8.04 8.04 0 0 1-1.75-1.47ZM13.82 16c.22 1.45.6 2.82 1.07 4.03A8.04 8.04 0 0 1 12 20c-.95-1.6-1.58-3.47-1.82-5.5h3.64Zm3.86-2H14.5c-.22-1.45-.6-2.82-1.07-4.03A8.03 8.03 0 0 1 19.93 13ZM10.43 6.97A8.03 8.03 0 0 1 12 4c.95 1.6 1.58 3.47 1.82 5.5H10.18c.22-1.45.6-2.82 1.07-4.03Z"/>
    </svg>
  `,
  telegram: `
    <svg class="official-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M21.95 4.57a1.5 1.5 0 0 0-1.55-.24L3.6 11.03c-1.12.47-1.1 2.07.03 2.51l4.57 1.74 1.76 5.58c.34 1.08 1.7 1.22 2.27.24l2.57-3.93 4.78 3.52c.89.66 2.17.16 2.4-.92l2.99-14.3ZM9.58 13.47l8.27-5.18-6.58 6.58-.44 3.08-1.25-4.48Z"/>
    </svg>
  `,
  twitter: `
    <svg class="official-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M17.53 3h3.08l-6.73 7.69L22 21h-6.2l-4.85-6.34L5.4 21H2.3l7.2-8.24L2 3h6.36l4.38 5.79L17.53 3Zm-1.08 16.2h1.71L7.64 4.77H5.8l10.65 14.43Z"/>
    </svg>
  `,
  discord: `
    <svg class="official-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M18.93 5.32A16.4 16.4 0 0 0 14.9 4a11.7 11.7 0 0 0-.55 1.13 15.2 15.2 0 0 0-4.7 0A11.4 11.4 0 0 0 9.1 4 16.3 16.3 0 0 0 5.07 5.32 17.2 17.2 0 0 0 2 18.1a16.5 16.5 0 0 0 5.03 2.56 12.4 12.4 0 0 0 1.08-1.75 10.7 10.7 0 0 1-1.7-.82c.14-.1.34-.22.35-.23a11.8 11.8 0 0 0 10.08 0l.35.23c-.55.31-1.1.58-1.7.82.31.64.68 1.22 1.08 1.75A16.4 16.4 0 0 0 22 18.1a17.1 17.1 0 0 0-3.07-12.78ZM8.02 15.33c-1.01 0-1.84-.93-1.84-2.07s.81-2.08 1.84-2.08 1.86.94 1.85 2.08-.82 2.07-1.85 2.07Zm7.96 0c-1.01 0-1.84-.93-1.84-2.07s.81-2.08 1.84-2.08 1.86.94 1.85 2.08-.82 2.07-1.85 2.07Z"/>
    </svg>
  `,
  facebook: `
    <svg class="official-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M13.5 9.5V7.7c0-.8.17-1.3 1.36-1.3H16V3h-2.1C11.6 3 10 4.6 10 7.2V9.5H7v3h3V21h3.5v-8.5H18v-3h-4.5Z"/>
    </svg>
  `,
  github: `
    <svg class="official-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 2.5-.34c.85 0 1.7.11 2.5.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/>
    </svg>
  `,
}

export function getLaunchOfficialLinks(launch: Launch): OfficialLinks {
  return launch.launchInfo.officialLinks ?? {}
}

export function catalogLinksToMetadataLinks(
  links: OfficialLinks,
): MetadataSocialLinks {
  return { ...links }
}

export function resolveOfficialLinks(
  launch: Launch,
  result: ReadTokenMintResult | null | undefined,
): MetadataSocialLinks {
  const catalog = catalogLinksToMetadataLinks(getLaunchOfficialLinks(launch))

  if (!result?.metadataJsonLoaded) {
    return catalog
  }

  return mergeSocialLinksPrimaryMetadata(result.jsonSocialLinks, catalog)
}

export function renderOfficialLinkItems(
  links: MetadataSocialLinks,
): string {
  return OFFICIAL_LINK_ORDER.flatMap((type) => {
    const url = links[type]

    if (!url) {
      return []
    }

    const label = OFFICIAL_LINK_LABELS[type]

    return [
      `
        <a
          class="official-link"
          href="${escapeHtml(url)}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="${escapeHtml(label)}"
          data-official-link="${type}"
        >
          ${OFFICIAL_LINK_ICONS[type]}
          <span class="official-link-label">${escapeHtml(label)}</span>
        </a>
      `,
    ]
  }).join('')
}

export function renderOfficialLinksRow(
  links: MetadataSocialLinks,
): string {
  if (!hasMetadataSocialLinks(links)) {
    return ''
  }

  return `
    <div class="official-links" data-official-links>
      ${renderOfficialLinkItems(links)}
    </div>
  `
}

export function renderOfficialLinksPanel(
  links: MetadataSocialLinks,
): string {
  if (!hasMetadataSocialLinks(links)) {
    return ''
  }

  return `
    <div class="launch-info-links" data-official-links-panel>
      <span class="launch-info-links-label">Official Links</span>
      ${renderOfficialLinksRow(links)}
    </div>
  `
}

export function renderLaunchOfficialLinksPanel(launch: Launch): string {
  return renderOfficialLinksPanel(
    catalogLinksToMetadataLinks(getLaunchOfficialLinks(launch)),
  )
}

export function applyOfficialLinksFromMetadata(
  root: ParentNode,
  launch: Launch,
  result: ReadTokenMintResult | null | undefined,
): void {
  const links = resolveOfficialLinks(launch, result)

  if (!hasMetadataSocialLinks(links)) {
    const existingPanel = root.querySelector('[data-official-links-panel]')

    if (existingPanel) {
      existingPanel.remove()
    }

    return
  }

  const panelHtml = renderOfficialLinksPanel(links)
  const existingPanel = root.querySelector('[data-official-links-panel]')

  if (existingPanel) {
    existingPanel.outerHTML = panelHtml
    return
  }

  const launchInfoSection = root.querySelector('[data-market-status-root]')

  if (!launchInfoSection) {
    return
  }

  launchInfoSection.insertAdjacentHTML('beforeend', panelHtml)
}
