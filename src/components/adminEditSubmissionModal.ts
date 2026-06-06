import { updateLaunchSubmissionDetails } from '../services/updateLaunchSubmissionDetailsService'
import type { LaunchSubmissionSummary } from '../types/launchSubmission'
import {
  validateSubmitLaunchForm,
  type SubmitLaunchFormValues,
} from '../utils/submitLaunchValidation'

export function renderAdminEditSubmissionModal(): string {
  return `
    <div
      class="submit-launch-modal"
      data-admin-edit-submission-modal
      hidden
      aria-hidden="true"
    >
      <div
        class="submit-launch-backdrop"
        data-admin-edit-submission-close
        aria-hidden="true"
      ></div>
      <div
        class="submit-launch-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-edit-submission-title"
      >
        <button
          type="button"
          class="submit-launch-close"
          data-admin-edit-submission-close
          aria-label="Close"
        >
          ×
        </button>

        <h2 class="submit-launch-title" id="admin-edit-submission-title">
          Edit Submission
        </h2>
        <p class="submit-launch-lead">
          Update project details before moving this launch to Coming Soon or Live.
        </p>

        <form class="submit-launch-form" data-admin-edit-submission-form novalidate>
          <label class="submit-launch-field">
            <span class="submit-launch-label">Project Name</span>
            <input
              class="submit-launch-input"
              type="text"
              name="projectName"
              data-admin-edit-project-name
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
              data-admin-edit-token-symbol
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
              data-admin-edit-mint
              autocomplete="off"
              spellcheck="false"
              required
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Logo URL</span>
            <input
              class="submit-launch-input"
              type="url"
              name="logoUrl"
              data-admin-edit-logo-url
              placeholder="https://example.com/logo.png"
              autocomplete="off"
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Website</span>
            <input
              class="submit-launch-input"
              type="url"
              name="website"
              data-admin-edit-website
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
              data-admin-edit-telegram
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
              data-admin-edit-x
              placeholder="https://x.com/yourproject"
              autocomplete="off"
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Description</span>
            <textarea
              class="submit-launch-input"
              name="description"
              data-admin-edit-description
              rows="4"
              required
            ></textarea>
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Contact Email</span>
            <input
              class="submit-launch-input"
              type="email"
              name="contactEmail"
              data-admin-edit-contact-email
              placeholder="you@example.com"
              autocomplete="email"
            />
          </label>

          <p
            class="submit-launch-error"
            data-admin-edit-submission-error
            hidden
            aria-live="polite"
          ></p>

          <div class="submit-launch-actions">
            <button
              type="button"
              class="secondary-btn"
              data-admin-edit-submission-close
            >
              Cancel
            </button>
            <button
              type="submit"
              class="primary-btn"
              data-admin-edit-submission-save
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `
}

export interface AdminEditSubmissionModalHandlers {
  onSaved: () => void | Promise<void>
  onUnauthorized: (message: string) => void
}

interface AdminEditSubmissionModalElements {
  modal: HTMLElement
  form: HTMLFormElement
  saveButton: HTMLButtonElement
  errorElement: HTMLElement
}

export function attachAdminEditSubmissionModal(
  handlers: AdminEditSubmissionModalHandlers,
): {
  openEditSubmissionModal: (submission: LaunchSubmissionSummary) => void
} {
  const modal = document.querySelector<HTMLElement>(
    '[data-admin-edit-submission-modal]',
  )

  if (!modal) {
    return { openEditSubmissionModal: () => {} }
  }

  const form = modal.querySelector<HTMLFormElement>(
    '[data-admin-edit-submission-form]',
  )
  const saveButton = modal.querySelector<HTMLButtonElement>(
    '[data-admin-edit-submission-save]',
  )
  const errorElement = modal.querySelector<HTMLElement>(
    '[data-admin-edit-submission-error]',
  )

  if (!form || !saveButton || !errorElement) {
    return { openEditSubmissionModal: () => {} }
  }

  return wireAdminEditSubmissionModal(handlers, {
    modal,
    form,
    saveButton,
    errorElement,
  })
}

function wireAdminEditSubmissionModal(
  handlers: AdminEditSubmissionModalHandlers,
  ui: AdminEditSubmissionModalElements,
): {
  openEditSubmissionModal: (submission: LaunchSubmissionSummary) => void
} {
  const { modal, form, saveButton, errorElement } = ui
  let activeSubmissionId: string | null = null
  let saveInFlight = false

  for (const closeTarget of modal.querySelectorAll(
    '[data-admin-edit-submission-close]',
  )) {
    closeTarget.addEventListener('click', () => {
      closeModal()
    })
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    void handleSave()
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal()
    }
  })

  form.addEventListener('input', () => {
    hideError()
  })

  function hideError(): void {
    errorElement.hidden = true
    errorElement.textContent = ''
  }

  function showError(message: string): void {
    errorElement.hidden = false
    errorElement.textContent = message
  }

  function setFormDisabled(disabled: boolean): void {
    for (const field of form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >('input, textarea')) {
      field.disabled = disabled
    }

    saveButton.disabled = disabled
  }

  function readFormValues(): SubmitLaunchFormValues {
    return {
      projectName:
        form.querySelector<HTMLInputElement>(
          '[data-admin-edit-project-name]',
        )?.value ?? '',
      tokenSymbol:
        form.querySelector<HTMLInputElement>(
          '[data-admin-edit-token-symbol]',
        )?.value ?? '',
      mintAddress:
        form.querySelector<HTMLInputElement>('[data-admin-edit-mint]')?.value ??
        '',
      logoUrl:
        form.querySelector<HTMLInputElement>(
          '[data-admin-edit-logo-url]',
        )?.value ?? '',
      website:
        form.querySelector<HTMLInputElement>('[data-admin-edit-website]')
          ?.value ?? '',
      telegram:
        form.querySelector<HTMLInputElement>('[data-admin-edit-telegram]')
          ?.value ?? '',
      x:
        form.querySelector<HTMLInputElement>('[data-admin-edit-x]')?.value ??
        '',
      description:
        form.querySelector<HTMLTextAreaElement>(
          '[data-admin-edit-description]',
        )?.value ?? '',
      contactEmail:
        form.querySelector<HTMLInputElement>(
          '[data-admin-edit-contact-email]',
        )?.value ?? '',
    }
  }

  function populateForm(submission: LaunchSubmissionSummary): void {
    form.querySelector<HTMLInputElement>(
      '[data-admin-edit-project-name]',
    )!.value = submission.projectName
    form.querySelector<HTMLInputElement>(
      '[data-admin-edit-token-symbol]',
    )!.value = submission.tokenSymbol
    form.querySelector<HTMLInputElement>(
      '[data-admin-edit-mint]',
    )!.value = submission.mintAddress
    form.querySelector<HTMLInputElement>(
      '[data-admin-edit-logo-url]',
    )!.value = submission.logoUrl ?? ''
    form.querySelector<HTMLInputElement>(
      '[data-admin-edit-website]',
    )!.value = submission.website ?? ''
    form.querySelector<HTMLInputElement>(
      '[data-admin-edit-telegram]',
    )!.value = submission.telegram ?? ''
    form.querySelector<HTMLInputElement>('[data-admin-edit-x]')!.value =
      submission.x ?? ''
    form.querySelector<HTMLTextAreaElement>(
      '[data-admin-edit-description]',
    )!.value = submission.description ?? ''
    form.querySelector<HTMLInputElement>(
      '[data-admin-edit-contact-email]',
    )!.value = submission.contactEmail ?? ''
  }

  function closeModal(): void {
    modal.hidden = true
    modal.setAttribute('aria-hidden', 'true')
    activeSubmissionId = null
    form.reset()
    hideError()
    setFormDisabled(false)
    saveButton.textContent = 'Save Changes'
  }

  function openEditSubmissionModal(submission: LaunchSubmissionSummary): void {
    activeSubmissionId = submission.id
    populateForm(submission)
    hideError()
    setFormDisabled(false)
    saveButton.textContent = 'Save Changes'
    modal.hidden = false
    modal.setAttribute('aria-hidden', 'false')
    form.querySelector<HTMLInputElement>(
      '[data-admin-edit-project-name]',
    )?.focus()
  }

  async function handleSave(): Promise<void> {
    if (saveInFlight || !activeSubmissionId) {
      return
    }

    hideError()

    const validation = validateSubmitLaunchForm(readFormValues())

    if (!validation.valid || !validation.values) {
      showError(validation.error ?? 'Please check the form and try again.')
      return
    }

    saveInFlight = true
    setFormDisabled(true)
    saveButton.textContent = 'Saving…'

    try {
      const result = await updateLaunchSubmissionDetails(
        activeSubmissionId,
        validation.values,
      )

      if (!result.ok) {
        if (result.unauthorized) {
          closeModal()
          handlers.onUnauthorized(
            'Your admin session expired. Please sign in again.',
          )
          return
        }

        showError(result.message)
        setFormDisabled(false)
        saveButton.textContent = 'Save Changes'
        return
      }

      closeModal()
      await handlers.onSaved()
    } finally {
      saveInFlight = false
    }
  }

  return { openEditSubmissionModal }
}
