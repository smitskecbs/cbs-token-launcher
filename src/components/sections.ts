import type { Launch } from '../types/launch'
import type { CbsTool } from '../types/tool'
import solanaLogomarkUrl from '../assets/solana-logomark.svg'
import { renderComingSoonCard } from './comingSoonCard'
import { renderLaunchCardList } from './launchCard'
import { renderSubmitLaunchButton } from './submitLaunchModal'
import { renderToolCardGrid } from './toolCard'

export function renderSiteHero(bannerHtml: string): string {
  return `
    <header class="site-hero site-hero--banner-only">
      ${bannerHtml}
    </header>
  `
}

export function renderLauncherOverviewSection(): string {
  return `
    <section
      class="page-section launcher-overview-section"
      aria-labelledby="launcher-overview-heading"
    >
      <div class="edu-block launcher-overview-card">
        <h2 class="edu-block-heading" id="launcher-overview-heading">
          What can you do here?
        </h2>
        <p class="edu-block-text">
          Use the CBS Token Launcher to submit and present your token project with
          clear information, links, status and community details.
        </p>
        <ul class="edu-block-list">
          <li>Submit your token project</li>
          <li>Add project name, symbol, logo and description</li>
          <li>Share website and community links</li>
          <li>Prepare your project for public visibility</li>
        </ul>
      </div>
    </section>
  `
}

export function renderHeroSection(): string {
  return `
    <section class="hero-card hero-card--compact">
      <h1 class="hero-title">
        <span class="hero-title__lead">Launch, discover and grow</span>
        <span class="hero-title__solana-word">
          <img
            class="hero-title__solana-logo"
            src="${solanaLogomarkUrl}"
            alt=""
            aria-hidden="true"
            width="20"
            height="16"
            decoding="async"
          />
          <span>Solana</span>
        </span>
        <span class="hero-title__trail">projects</span>
      </h1>
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
      <nav class="footer-links" aria-label="CBS ecosystem links">
        <a href="https://tools.cbs-coin.com" target="_blank" rel="noopener noreferrer">
          CBS Tools
        </a>
        <a href="https://cbs-coin.com" target="_blank" rel="noopener noreferrer">
          CBS Coin
        </a>
        <a href="https://github.com/smitskecbs" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </nav>

      <div class="footer-open-source">
        <p class="footer-open-title">Built in the Open</p>
        <p class="footer-open-text">
          CBS Tools is developed publicly and transparently.
          Source code, improvements and community contributions can be followed on GitHub.
        </p>
        <a
          class="footer-github-link"
          href="https://github.com/smitskecbs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            class="footer-github-icon"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
          GitHub
        </a>
      </div>

      <p class="footer-badge-row">
        Open Source • Community Driven • Built on Solana
      </p>

      <p class="site-footer-copy">
        Community-built tools for Solana builders.
      </p>
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
