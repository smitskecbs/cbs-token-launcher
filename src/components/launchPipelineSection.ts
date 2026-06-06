const PIPELINE_STEPS = [
  'Submit project',
  'Manual review',
  'Coming Soon listing',
  'Live launch listing',
] as const

function renderPipelineSteps(): string {
  return PIPELINE_STEPS.map((label, index) => {
    const stepNumber = index + 1

    return `
      <li class="launch-pipeline-step">
        <span class="launch-pipeline-step-number" aria-hidden="true">
          ${stepNumber}
        </span>
        <span class="launch-pipeline-step-label">${label}</span>
      </li>
    `
  }).join('')
}

export function renderLaunchPipelineSection(): string {
  return `
    <section
      class="page-section launch-pipeline-section"
      aria-labelledby="launch-pipeline-heading"
    >
      <h2 class="section-title" id="launch-pipeline-heading">
        How the launcher works
      </h2>
      <div class="launch-pipeline-card">
        <p class="launch-pipeline-lead">
          Projects can be submitted through the launcher, reviewed manually, and
          then moved to Coming Soon or Live when ready.
        </p>
        <ol class="launch-pipeline-steps" aria-label="Launch pipeline steps">
          ${renderPipelineSteps()}
        </ol>
      </div>
    </section>
  `
}
