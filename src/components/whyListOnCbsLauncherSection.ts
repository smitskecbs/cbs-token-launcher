import { escapeHtml } from '../utils/html'

interface WhyListBenefit {
  title: string
  description: string
}

const BENEFITS: WhyListBenefit[] = [
  {
    title: 'Free Listing',
    description:
      'Submit your project at no cost and build visibility before launch.',
  },
  {
    title: 'Community Exposure',
    description: 'Appear in featured and trending launch sections.',
  },
  {
    title: 'Launch Updates',
    description: 'Keep supporters informed with project progress updates.',
  },
  {
    title: 'Interest Tracking',
    description: 'Measure community demand before launch.',
  },
  {
    title: 'Verified Projects',
    description: 'Earn additional trust through project verification.',
  },
  {
    title: 'Dedicated Project Page',
    description:
      'Get a public page with project details, links and trading information.',
  },
]

function renderBenefitCard(benefit: WhyListBenefit): string {
  const title = escapeHtml(benefit.title)
  const description = escapeHtml(benefit.description)

  return `
    <article class="launch-card launch-your-project-card">
      <h3 class="launch-your-project-card__title">${title}</h3>
      <p class="launch-your-project-card__description">${description}</p>
    </article>
  `
}

export function renderWhyListOnCbsLauncherSection(): string {
  return `
    <section
      class="page-section why-list-on-cbs-section"
      aria-labelledby="why-list-on-cbs-heading"
    >
      <h2 class="section-title" id="why-list-on-cbs-heading">
        Why List On CBS Launcher
      </h2>
      <p class="launch-your-project-subtitle">
        Give your Solana project visibility, community engagement and a
        dedicated launch page.
      </p>
      <div class="launch-your-project-grid">
        ${BENEFITS.map(renderBenefitCard).join('')}
      </div>
    </section>
  `
}
