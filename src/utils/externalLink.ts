import { escapeHtml } from './html'

export function isExternalLink(link: HTMLAnchorElement): boolean {
  const href = link.getAttribute('href')?.trim() ?? ''

  if (href.startsWith('https://') || href.startsWith('http://')) {
    return true
  }

  if (link.target === '_blank') {
    return true
  }

  return link.rel.split(/\s+/).includes('noopener')
}

export function isValidHttpsUrl(value: string | null | undefined): boolean {
  const trimmed = typeof value === 'string' ? value.trim() : ''

  if (!trimmed) {
    return false
  }

  try {
    const url = new URL(trimmed)

    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function renderExternalAnchorHtml(
  url: string,
  label: string,
  className: string,
  extraAttributes = '',
): string {
  const trimmed = url.trim()

  if (!isValidHttpsUrl(trimmed)) {
    console.warn(`[external-link] skipped invalid href for ${label}: ${url}`)
    return ''
  }

  return `<a class="${escapeHtml(className)}" href="${escapeHtml(trimmed)}" target="_blank" rel="noopener noreferrer"${extraAttributes}>${escapeHtml(label)}</a>`
}
