import type { Launch } from '../types/launch'
import type { CbsTool } from '../types/tool'
import { renderComingSoonCard } from './comingSoonCard'
import { renderLaunchCardList } from './launchCard'
import { renderSubmitLaunchButton } from './submitLaunchModal'
import { renderToolCardGrid } from './toolCard'

export function renderHeroSection(): string {
  return `
    <section class="hero-card hero-card--compact">
      <h1 class="hero-title">Launch, discover and grow Solana projects</h1>
      <p class="hero-text">
        Submit your token, build interest, share updates and help people find
        your project.
      </p>
      <div class="hero-actions hero-actions--single">
        ${renderSubmitLaunchButton()}
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
      ${renderLaunchCardList(launches, 'featured')}
    </section>
  `
}

export function renderListedLaunchesSection(
  launches: Launch[],
): string {
  if (launches.length === 0) {
    return ''
  }

  return `
    <section
      class="page-section"
      data-launch-section="listed"
      aria-labelledby="listed-heading"
    >
      <h2 class="section-title" id="listed-heading">
        Listed Launches
      </h2>
      ${renderLaunchCardList(launches, 'listed')}
    </section>
  `
}

export function renderTrendingLaunchesSection(
  launches: Launch[],
  totalListedLaunches: number,
): string {
  if (totalListedLaunches < 3) {
    return ''
  }

  return `
    <section
      class="page-section"
      data-launch-section="trending"
      aria-labelledby="trending-heading"
    >
      <h2 class="section-title" id="trending-heading">
        Trending Launches
      </h2>
      ${
        launches.length > 0
          ? renderLaunchCardList(launches, 'trending')
          : renderTrendingPlaceholderCard()
      }
    </section>
  `
}

export function renderNewLaunchesSection(
  launches: Launch[],
): string {
  if (launches.length === 0) {
    return ''
  }

  return `
    <section
      class="page-section"
      data-launch-section="new"
      aria-labelledby="new-heading"
    >
      <h2 class="section-title" id="new-heading">
        New Launches
      </h2>
      ${renderLaunchCardList(launches, 'new')}
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
      ${renderLaunchCardList(launches, 'ecosystem')}
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
          ? renderLaunchCardList(launches, 'upcoming')
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

function renderTrendingPlaceholderCard(): string {
  return `
    <article class="launch-card launch-card--placeholder launch-card--trending" data-launch-filter-placeholder>
      <div class="coming-soon-icon" aria-hidden="true">📈</div>
      <h3>Trending data coming soon</h3>
      <p class="coming-soon-text">
        Launch analytics will power trending rankings here.
      </p>
    </article>
  `
}
