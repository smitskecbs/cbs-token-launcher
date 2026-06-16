import { renderSubmitLaunchButton } from './submitLaunchModal'

export function renderLaunchYourProjectCta(): string {
  return `
    <section
      class="page-section launch-your-project-cta-section"
      aria-labelledby="launch-your-project-cta-heading"
    >
      <div class="launch-your-project-cta">
        <h3 class="launch-your-project-cta__heading" id="launch-your-project-cta-heading">
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
