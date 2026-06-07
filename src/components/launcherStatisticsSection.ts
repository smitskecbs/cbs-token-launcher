import {
  computeLauncherCatalogStatistics,
  fetchLaunchUpdatesTotalCount,
  formatLauncherStatisticValue,
  type LauncherCatalogStatistics,
} from '../services/launcherStatisticsService'
import type { Launch } from '../types/launch'
import { renderFeatureCardCarousel } from './featureCardCarousel'
import { escapeHtml } from '../utils/html'

type LauncherStatisticKey = keyof LauncherCatalogStatistics | 'totalProjectUpdates'

interface StatCardDefinition {
  key: LauncherStatisticKey
  label: string
}

const STAT_CARDS: StatCardDefinition[] = [
  { key: 'totalLaunches', label: 'Listed' },
  { key: 'liveLaunches', label: 'Live' },
  { key: 'comingSoonLaunches', label: 'Upcoming' },
  { key: 'communityInterestVotes', label: 'Votes' },
  { key: 'totalProjectUpdates', label: 'Updates' },
]

function renderStatCard(
  definition: StatCardDefinition,
  options: { loading?: boolean; value?: string } = {},
): string {
  const label = escapeHtml(definition.label)
  const loading = options.loading === true
  const value = loading
    ? '…'
    : escapeHtml(options.value ?? '—')

  return `
    <article class="launcher-stat-card">
      <p class="launcher-stat-card__label">${label}</p>
      <p
        class="launcher-stat-card__value${loading ? ' launcher-stat-card__value--loading' : ''}"
        data-launcher-stat="${escapeHtml(definition.key)}"
        aria-live="polite"
      >
        ${value}
      </p>
    </article>
  `
}

export function renderLauncherStatisticsSection(
  catalog: Launch[],
): string {
  const stats = computeLauncherCatalogStatistics(catalog)

  return `
    <section
      class="page-section launcher-statistics-section"
      data-launcher-statistics
      aria-labelledby="launcher-activity-heading"
    >
      <h2 class="section-title" id="launcher-activity-heading">
        Launcher Activity
      </h2>
      ${renderFeatureCardCarousel(
        STAT_CARDS.map((card) => {
          if (card.key === 'totalProjectUpdates') {
            return renderStatCard(card, { loading: true })
          }

          const value = formatLauncherStatisticValue(stats[card.key])

          return renderStatCard(card, { value })
        }).join(''),
        { variant: 'stats' },
      )}
    </section>
  `
}

export function attachLauncherStatisticsSection(): void {
  const valueElement = document.querySelector<HTMLElement>(
    '[data-launcher-stat="totalProjectUpdates"]',
  )

  if (!valueElement) {
    return
  }

  void loadTotalProjectUpdates(valueElement)
}

async function loadTotalProjectUpdates(
  valueElement: HTMLElement,
): Promise<void> {
  const result = await fetchLaunchUpdatesTotalCount()

  valueElement.classList.remove('launcher-stat-card__value--loading')
  valueElement.textContent = result.ok
    ? formatLauncherStatisticValue(result.totalCount)
    : '—'
}
