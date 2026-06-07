import type { Launch } from '../types/launch'
import {
  getSearchResultLaunchCardInstanceId,
  renderLaunchCard,
} from './launchCard'

export function renderLaunchSearchResultsShell(): string {
  return `
    <section
      class="page-section launch-search-results"
      data-launch-search-results
      hidden
      aria-live="polite"
      aria-label="Search results"
    >
      <div
        class="launch-search-results__body"
        data-launch-search-results-body
      ></div>
    </section>
  `
}

export function renderLaunchSearchResultsContent(
  launches: Launch[],
): string {
  if (launches.length === 0) {
    return `
      <article class="launch-card launch-card--placeholder launch-search-results__empty-card">
        <p class="coming-soon-text launch-search-results__empty">
          No launches found.
        </p>
      </article>
    `
  }

  return `
    <div class="launch-card-list launch-search-results__list">
      ${launches
        .map((launch, index) =>
          renderLaunchCard(launch, {
            sectionRank: index + 1,
            cardInstanceId: getSearchResultLaunchCardInstanceId(launch.id),
          }),
        )
        .join('')}
    </div>
  `
}
