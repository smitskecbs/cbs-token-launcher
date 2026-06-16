export function renderLaunchPipelineSection(): string {
  return `
    <section
      class="page-section launcher-process-section"
      aria-labelledby="launcher-process-card-title"
    >
      <article
        class="launcher-process-card launcher-process-card--featured edu-block"
        data-launcher-process-open
        tabindex="0"
        role="button"
        aria-labelledby="launcher-process-card-title"
      >
        <h2 class="edu-block-heading" id="launcher-process-card-title">
          How the CBS Token Launcher Works
        </h2>
        <p class="edu-block-text">
          The launcher helps builders present projects clearly, collect community
          interest and share launch updates.
        </p>
        <span class="secondary-btn launcher-process-card__btn">Learn More</span>
      </article>
    </section>
  `
}
