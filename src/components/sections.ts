import type { Launch } from '../types/launch'
import type { CbsTool } from '../types/tool'
import { renderComingSoonCard } from './comingSoonCard'
import { renderLaunchCardList } from './launchCard'
import { renderLaunchDataActions } from './launchDataActions'
import { renderSubmitLaunchButton } from './submitLaunchModal'
import { renderToolCardGrid } from './toolCard'

export function renderHeroSection(): string {
  return `
    <section class="hero-card">
      <h1>CBS Token Launcher</h1>
      <p class="hero-text">
        Discover CBS token launches on Solana, review essential market info,
        and submit tokens created with CBS Token Builder.
      </p>
      <div class="hero-actions">
        ${renderSubmitLaunchButton()}
        ${renderLaunchDataActions()}
      </div>
    </section>
  `
}

export function renderFeaturedLaunchesSection(
  launches: Launch[],
): string {
  if (launches.length === 0) {
    return ''
  }

  return `
    <section
      class="page-section"
      data-launch-section="featured"
      aria-labelledby="featured-heading"
    >
      <h2 class="section-title" id="featured-heading">
        Featured Launches
      </h2>
      ${renderLaunchCardList(launches)}
    </section>
  `
}

export function renderCbsEcosystemTokensSection(
  launches: Launch[],
): string {
  if (launches.length === 0) {
    return ''
  }

  return `
    <section
      class="page-section"
      data-launch-section="ecosystem"
      aria-labelledby="ecosystem-heading"
    >
      <h2 class="section-title" id="ecosystem-heading">
        CBS Ecosystem Tokens
      </h2>
      ${renderLaunchCardList(launches)}
    </section>
  `
}

export function renderUpcomingLaunchesSection(
  launches: Launch[],
): string {
  return `
    <section
      class="page-section"
      data-launch-section="upcoming"
      aria-labelledby="upcoming-heading"
    >
      <h2 class="section-title" id="upcoming-heading">
        Upcoming Launches
      </h2>
      ${
        launches.length > 0
          ? renderLaunchCardList(launches)
          : renderComingSoonCard()
      }
    </section>
  `
}

export function renderCbsToolsSection(tools: CbsTool[]): string {
  return `
    <section
      class="page-section"
      aria-labelledby="tools-heading"
    >
      <h2 class="section-title" id="tools-heading">
        CBS Tools
      </h2>
      ${renderToolCardGrid(tools)}
    </section>
  `
}

export function renderFooter(): string {
  return `
    <footer class="site-footer">
      <p>Always verify the official mint address before interacting with any token.</p>
    </footer>
  `
}
