import { renderFeatureCardCarousel } from './featureCardCarousel'
import { escapeHtml } from '../utils/html'

interface WhyListBenefit {
  title: string
  description: string
}

const BENEFITS: WhyListBenefit[] = [
  {
    title: 'Free to list',
    description:
      'Submit your project at no cost and build visibility before launch.',
  },
  {
    title: 'Get seen',
    description: 'Appear in featured and trending sections.',
  },
  {
    title: 'Share updates',
    description: 'Post progress updates for your community.',
  },
  {
    title: 'Track interest',
    description: 'See how many people are interested.',
  },
  {
    title: 'Build trust',
    description: 'Use verification to show your project was reviewed.',
  },
  {
    title: 'Project page',
    description:
      'Get one page with your token info, links and trading status.',
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
        Why List Here?
      </h2>
      <p class="launch-your-project-subtitle">
        Show your project, collect interest and keep your community updated.
      </p>
      ${renderFeatureCardCarousel(BENEFITS.map(renderBenefitCard).join(''))}
    </section>
  `
}
