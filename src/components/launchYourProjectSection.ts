import { renderSubmitLaunchButton } from './submitLaunchModal'
import { escapeHtml } from '../utils/html'

interface LaunchYourProjectFeature {
  title: string
  description: string
}

const FEATURES: LaunchYourProjectFeature[] = [
  {
    title: 'Submit Your Launch',
    description: 'Submit your token for manual review and listing.',
  },
  {
    title: 'Community Interest',
    description:
      'Collect interest votes before launch and measure community demand.',
  },
  {
    title: 'Launch Updates',
    description: 'Publish progress updates and keep supporters informed.',
  },
  {
    title: 'Featured Exposure',
    description:
      'Get visibility through featured listings and homepage placement.',
  },
  {
    title: 'Project Profile',
    description:
      'Dedicated launch page with token information, socials and links.',
  },
  {
    title: 'Growth Tracking',
    description: 'Track community activity and project momentum over time.',
  },
]

function renderFeatureCard(feature: LaunchYourProjectFeature): string {
  const title = escapeHtml(feature.title)
  const description = escapeHtml(feature.description)

  return `
    <article class="launch-card launch-your-project-card">
      <h3 class="launch-your-project-card__title">${title}</h3>
      <p class="launch-your-project-card__description">${description}</p>
    </article>
  `
}

export function renderLaunchYourProjectSection(): string {
  return `
    <section
      class="page-section launch-your-project-section"
      aria-labelledby="launch-your-project-heading"
    >
      <h2 class="section-title" id="launch-your-project-heading">
        Launch Your Project
      </h2>
      <p class="launch-your-project-subtitle">
        Launch, promote and grow your Solana project with the CBS Token Launcher.
      </p>
      <div class="launch-your-project-grid">
        ${FEATURES.map(renderFeatureCard).join('')}
      </div>
      <div class="launch-your-project-cta">
        <h3 class="launch-your-project-cta__heading">
          Ready to launch your project?
        </h3>
        <p class="launch-your-project-cta__text">
          Submit your Solana token and start building visibility before launch day.
        </p>
        <div class="launch-your-project-cta__actions">
          ${renderSubmitLaunchButton()}
        </div>
      </div>
    </section>
  `
}
