import { escapeHtml } from '../utils/html'

const PROCESS_STEPS = [
  {
    title: 'Submit Launch',
    description:
      'Submit your project with token information, links and details.',
  },
  {
    title: 'Manual Review',
    description: 'Projects are reviewed before being listed.',
  },
  {
    title: 'Community Interest',
    description: 'Builders can measure interest and collect feedback.',
  },
  {
    title: 'Launch Updates',
    description: 'Share progress updates with supporters.',
  },
  {
    title: 'Project Page',
    description:
      'Every project gets a public page with information and links.',
  },
  {
    title: 'Coming Soon',
    description: 'Projects preparing for launch can be featured.',
  },
  {
    title: 'Live',
    description: 'When ready, projects can move to a live launch listing.',
  },
] as const

function renderProcessSteps(): string {
  return PROCESS_STEPS.map(
    (step) => `
      <li>
        <strong>${escapeHtml(step.title)}</strong>
        ${escapeHtml(step.description)}
      </li>
    `,
  ).join('')
}

export function renderLaunchProcessModal(): string {
  return `
    <div
      class="tool-modal"
      data-launcher-process-modal
      hidden
      aria-hidden="true"
    >
      <button
        type="button"
        class="tool-modal-backdrop"
        data-launcher-process-close
        aria-label="Close dialog"
      ></button>
      <div
        class="tool-modal-dialog tool-modal-dialog--detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="launcher-process-modal-title"
      >
        <button
          type="button"
          class="tool-modal-close"
          data-launcher-process-close
          aria-label="Close"
        >
          ×
        </button>
        <div class="tool-modal-header">
          <h2 class="tool-modal-title" id="launcher-process-modal-title">
            CBS Token Launcher Process
          </h2>
        </div>
        <div class="tool-modal-body">
          <ol class="tool-modal-steps">
            ${renderProcessSteps()}
          </ol>
          <p class="tool-modal-note">
            The launcher is designed to help builders present projects clearly
            and transparently.
          </p>
        </div>
      </div>
    </div>
  `
}

export function attachLaunchProcessModal(): void {
  const modal = document.querySelector<HTMLElement>(
    '[data-launcher-process-modal]',
  )

  if (!modal) {
    return
  }

  const openTriggers = document.querySelectorAll<HTMLElement>(
    '[data-launcher-process-open]',
  )

  const closeModal = () => {
    modal.hidden = true
    modal.setAttribute('aria-hidden', 'true')
    document.body.classList.remove('tool-modal-open')
  }

  const openModal = () => {
    modal.hidden = false
    modal.setAttribute('aria-hidden', 'false')
    document.body.classList.add('tool-modal-open')
    modal.querySelector<HTMLElement>('.tool-modal-close')?.focus()
  }

  for (const trigger of openTriggers) {
    trigger.addEventListener('click', (event) => {
      event.preventDefault()
      openModal()
    })

    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return
      }

      event.preventDefault()
      openModal()
    })
  }

  for (const closeTarget of modal.querySelectorAll(
    '[data-launcher-process-close]',
  )) {
    closeTarget.addEventListener('click', () => {
      closeModal()
    })
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal()
    }
  })
}
