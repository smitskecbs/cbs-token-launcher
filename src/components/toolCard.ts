import type { CbsTool } from '../types/tool'
import { escapeHtml } from '../utils/html'

function renderToolLogo(tool: CbsTool): string {
  if (tool.logoUrl) {
    return `
      <img
        class="tool-card-logo"
        src="${escapeHtml(tool.logoUrl)}"
        alt=""
        loading="lazy"
      />
    `
  }

  return `
    <span class="tool-card-logo-fallback" aria-hidden="true">
      ${escapeHtml(tool.iconFallback)}
    </span>
  `
}

function renderToolCardBody(tool: CbsTool, name: string, description: string): string {
  const action = tool.isCurrent
    ? ''
    : '<span class="tool-card-action">Open tool</span>'

  return `
    <div class="tool-card-body">
      <h3 class="tool-card-title">${name}</h3>
      <div class="tool-card-logo-wrap">
        ${renderToolLogo(tool)}
      </div>
      <p class="tool-card-description">${description}</p>
      ${action}
    </div>
  `
}

export function renderToolCard(tool: CbsTool): string {
  const name = escapeHtml(tool.name)
  const description = escapeHtml(tool.description)
  const body = renderToolCardBody(tool, name, description)

  if (tool.isCurrent) {
    return `
      <article
        class="tool-card tool-card--current"
        aria-label="${name} — current page"
        aria-current="page"
      >
        ${body}
      </article>
    `
  }

  const url = escapeHtml(tool.url)

  return `
    <a
      class="tool-card"
      href="${url}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="${name}"
    >
      ${body}
    </a>
  `
}

export function renderToolCardGrid(tools: CbsTool[]): string {
  return `
    <div class="tools-grid">
      ${tools.map((tool) => renderToolCard(tool)).join('')}
    </div>
  `
}
