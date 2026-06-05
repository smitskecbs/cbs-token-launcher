import { submitLaunchRequest } from '../services/submitLaunchService'
import {
  validateSubmitLaunchForm,
  type SubmitLaunchFormValues,
} from '../utils/submitLaunchValidation'

export function renderSubmitLaunchModal(): string {
  return `
    <div
      class="submit-launch-modal"
      data-submit-launch-modal
      hidden
      aria-hidden="true"
    >
      <div
        class="submit-launch-backdrop"
        data-submit-launch-close
        aria-hidden="true"
      ></div>
      <div
        class="submit-launch-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-launch-title"
      >
        <button
          type="button"
          class="submit-launch-close"
          data-submit-launch-close
          aria-label="Close"
        >
          ×
        </button>

        <h2 class="submit-launch-title" id="submit-launch-title">
          Submit Launch
        </h2>
        <p class="submit-launch-lead">
          Submit a token created with CBS Token Builder for listing on the launchpad.
          Submissions are reviewed manually before going live.
        </p>

        <form class="submit-launch-form" data-submit-launch-form novalidate>
          <label class="submit-launch-field">
            <span class="submit-launch-label">Project Name</span>
            <input
              class="submit-launch-input"
              type="text"
              name="projectName"
              data-submit-project-name
              placeholder="e.g. CBS Coin"
              autocomplete="organization"
              required
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Token Symbol</span>
            <input
              class="submit-launch-input"
              type="text"
              name="tokenSymbol"
              data-submit-token-symbol
              placeholder="e.g. CBS"
              autocomplete="off"
              spellcheck="false"
              required
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Mint Address</span>
            <input
              class="submit-launch-input"
              type="text"
              name="mintAddress"
              data-submit-mint
              placeholder="Solana mint address"
              autocomplete="off"
              spellcheck="false"
              required
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Website</span>
            <input
              class="submit-launch-input"
              type="url"
              name="website"
              data-submit-website
              placeholder="https://example.com"
              autocomplete="url"
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Telegram</span>
            <input
              class="submit-launch-input"
              type="text"
              name="telegram"
              data-submit-telegram
              placeholder="https://t.me/yourproject"
              autocomplete="off"
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">X</span>
            <input
              class="submit-launch-input"
              type="text"
              name="x"
              data-submit-x
              placeholder="https://x.com/yourproject"
              autocomplete="off"
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Description</span>
            <textarea
              class="submit-launch-input"
              name="description"
              data-submit-description
              rows="4"
              placeholder="Describe your project and token"
              required
            ></textarea>
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Contact Email</span>
            <input
              class="submit-launch-input"
              type="email"
              name="contactEmail"
              data-submit-contact-email
              placeholder="you@example.com"
              autocomplete="email"
            />
          </label>

          <p
            class="submit-launch-error"
            data-submit-error
            hidden
            aria-live="polite"
          ></p>

          <p
            class="submit-launch-verify-status is-success"
            data-submit-success
            hidden
            aria-live="polite"
          ></p>

          <div class="submit-launch-actions">
            <button
              type="button"
              class="secondary-btn"
              data-submit-launch-close
            >
              Cancel
            </button>
            <button
              type="submit"
              class="primary-btn"
              data-submit-launch-submit
            >
              Submit Launch
            </button>
          </div>
        </form>
      </div>
    </div>
  `
}

export function attachSubmitLaunchModal(): void {
  const modal = document.querySelector<HTMLElement>(
    '[data-submit-launch-modal]',
  )

  if (!modal) {
    return
  }

  const form = modal.querySelector<HTMLFormElement>(
    '[data-submit-launch-form]',
  )
  const submitButton = modal.querySelector<HTMLButtonElement>(
    '[data-submit-launch-submit]',
  )
  const errorElement = modal.querySelector<HTMLElement>(
    '[data-submit-error]',
  )
  const successElement = modal.querySelector<HTMLElement>(
    '[data-submit-success]',
  )

  if (!form || !submitButton || !errorElement || !successElement) {
    return
  }

  wireSubmitLaunchModal({
    modal,
    form,
    submitButton,
    errorElement,
    successElement,
  })
}

interface SubmitLaunchModalElements {
  modal: HTMLElement
  form: HTMLFormElement
  submitButton: HTMLButtonElement
  errorElement: HTMLElement
  successElement: HTMLElement
}

function wireSubmitLaunchModal(ui: SubmitLaunchModalElements): void {
  const { modal, form, submitButton, errorElement, successElement } = ui
  let submitInFlight = false

  const openButtons = document.querySelectorAll<HTMLElement>(
    '[data-open-submit-launch]',
  )

  for (const button of openButtons) {
    button.addEventListener('click', () => {
      openModal()
    })
  }

  for (const closeTarget of modal.querySelectorAll('[data-submit-launch-close]')) {
    closeTarget.addEventListener('click', () => {
      closeModal()
    })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    void handleSubmit()
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal()
    }
  })

  form.addEventListener('input', () => {
    hideError()
    hideSuccess()
  })

  function openModal(): void {
    resetForm()
    modal.hidden = false
    modal.setAttribute('aria-hidden', 'false')
    form.querySelector<HTMLInputElement>(
      '[data-submit-project-name]',
    )?.focus()
  }

  function closeModal(): void {
    modal.hidden = true
    modal.setAttribute('aria-hidden', 'true')
    resetForm()
  }

  function resetForm(): void {
    form.reset()
    hideError()
    hideSuccess()
    submitButton.disabled = false
    submitButton.textContent = 'Submit Launch'
    setFormDisabled(false)
  }

  function hideError(): void {
    errorElement.hidden = true
    errorElement.textContent = ''
  }

  function showError(message: string): void {
    errorElement.hidden = false
    errorElement.textContent = message
  }

  function hideSuccess(): void {
    successElement.hidden = true
    successElement.textContent = ''
  }

  function showSuccess(message: string): void {
    successElement.hidden = false
    successElement.textContent = message
  }

  function setFormDisabled(disabled: boolean): void {
    for (const field of form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >('input, textarea')) {
      field.disabled = disabled
    }
  }

  function readFormValues(): SubmitLaunchFormValues {
    return {
      projectName:
        form.querySelector<HTMLInputElement>(
          '[data-submit-project-name]',
        )?.value ?? '',
      tokenSymbol:
        form.querySelector<HTMLInputElement>(
          '[data-submit-token-symbol]',
        )?.value ?? '',
      mintAddress:
        form.querySelector<HTMLInputElement>('[data-submit-mint]')?.value ?? '',
      website:
        form.querySelector<HTMLInputElement>('[data-submit-website]')?.value ??
        '',
      telegram:
        form.querySelector<HTMLInputElement>('[data-submit-telegram]')?.value ??
        '',
      x: form.querySelector<HTMLInputElement>('[data-submit-x]')?.value ?? '',
      description:
        form.querySelector<HTMLTextAreaElement>(
          '[data-submit-description]',
        )?.value ?? '',
      contactEmail:
        form.querySelector<HTMLInputElement>(
          '[data-submit-contact-email]',
        )?.value ?? '',
    }
  }

  async function handleSubmit(): Promise<void> {
    if (submitInFlight) {
      return
    }

    hideError()
    hideSuccess()

    const validation = validateSubmitLaunchForm(readFormValues())

    if (!validation.valid || !validation.values) {
      showError(validation.error ?? 'Please check the form and try again.')
      return
    }

    submitInFlight = true
    submitButton.disabled = true

    try {
      const result = await submitLaunchRequest(validation.values)

      if (!result.ok) {
        showError(result.message)
        submitButton.disabled = false
        return
      }

      setFormDisabled(true)
      submitButton.textContent = 'Submitted'
      showSuccess(
        'Your launch submission was received and is pending manual review. We will contact you if more information is needed.',
      )
    } finally {
      submitInFlight = false
    }
  }
}

export function renderSubmitLaunchButton(): string {
  return `
    <button
      type="button"
      class="primary-btn submit-launch-open-btn"
      data-open-submit-launch
    >
      Submit Launch
    </button>
  `
}
