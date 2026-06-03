import type { Launch, LaunchSection, LaunchStatus } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import { isValidMintAddress } from '../solana/getTokenInfo'
import { loadMintVerification } from '../services/mintVerificationService'
import {
  createSubmittedLaunchId,
  isMintAlreadyListed,
  saveSubmittedLaunchRecord,
  type SubmittedLaunchRecord,
} from '../services/submittedLaunchesStorage'
import {
  applySubmitLaunchPreview,
  canSubmitVerifiedMint,
  clearSubmitLaunchPreview,
  renderSubmitLaunchPreview,
} from './submitLaunchPreview'
import { validateEditableLaunchFields } from '../utils/launchValidation'

export interface SubmitLaunchFormValues {
  mintAddress: string
  section: LaunchSection
  status: LaunchStatus
  launchDate: string
}

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
          Mint and metadata are verified before submission.
        </p>

        <form class="submit-launch-form" data-submit-launch-form novalidate>
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

          <div class="submit-launch-verify-row">
            <button
              type="button"
              class="secondary-btn"
              data-submit-verify-mint
            >
              Verify Mint &amp; Metadata
            </button>
            <span
              class="submit-launch-verify-status"
              data-submit-verify-status
              aria-live="polite"
            ></span>
          </div>

          ${renderSubmitLaunchPreview()}

          <label class="submit-launch-field">
            <span class="submit-launch-label">Launch Status</span>
            <select class="submit-launch-input" name="status" data-submit-status required>
              <option value="preparing">Preparing</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
            </select>
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Launch Section</span>
            <select class="submit-launch-input" name="section" data-submit-section required>
              <option value="featured">Featured</option>
              <option value="ecosystem">Ecosystem</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Launch Date</span>
            <input
              class="submit-launch-input"
              type="text"
              name="launchDate"
              data-submit-launch-date
              placeholder="e.g. Coming soon, Live on Solana"
              required
            />
          </label>

          <p
            class="submit-launch-error"
            data-submit-error
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
              disabled
            >
              Submit Launch
            </button>
          </div>
        </form>
      </div>
    </div>
  `
}

export function attachSubmitLaunchModal(
  onSubmitted: () => void,
  getCatalog: () => Launch[],
): void {
  const modal = document.querySelector<HTMLElement>(
    '[data-submit-launch-modal]',
  )

  if (!modal) {
    return
  }

  const form = modal.querySelector<HTMLFormElement>(
    '[data-submit-launch-form]',
  )
  const mintInput = modal.querySelector<HTMLInputElement>(
    '[data-submit-mint]',
  )
  const verifyButton = modal.querySelector<HTMLButtonElement>(
    '[data-submit-verify-mint]',
  )
  const verifyStatus = modal.querySelector<HTMLElement>(
    '[data-submit-verify-status]',
  )
  const preview = modal.querySelector<HTMLElement>('[data-submit-preview]')
  const submitButton = modal.querySelector<HTMLButtonElement>(
    '[data-submit-launch-submit]',
  )
  const errorElement = modal.querySelector<HTMLElement>(
    '[data-submit-error]',
  )

  if (
    !form ||
    !mintInput ||
    !verifyButton ||
    !verifyStatus ||
    !preview ||
    !submitButton ||
    !errorElement
  ) {
    return
  }

  wireSubmitLaunchModal(
    {
      modal,
      form,
      mintInput,
      verifyButton,
      verifyStatus,
      preview,
      submitButton,
      errorElement,
    },
    onSubmitted,
    getCatalog,
  )
}

interface SubmitLaunchModalElements {
  modal: HTMLElement
  form: HTMLFormElement
  mintInput: HTMLInputElement
  verifyButton: HTMLButtonElement
  verifyStatus: HTMLElement
  preview: HTMLElement
  submitButton: HTMLButtonElement
  errorElement: HTMLElement
}

function wireSubmitLaunchModal(
  ui: SubmitLaunchModalElements,
  onSubmitted: () => void,
  getCatalog: () => Launch[],
): void {
  const {
    modal,
    form,
    mintInput,
    verifyButton,
    verifyStatus,
    preview,
    submitButton,
    errorElement,
  } = ui

  let verifiedResult: ReadTokenMintResult | null = null
  let verifiedMint = ''
  let isDuplicateMint = false
  let verifyInFlight = false

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

  mintInput.addEventListener('input', () => {
    hideError()

    if (mintInput.value.trim() !== verifiedMint) {
      resetVerification()
      return
    }

    updateSubmitEnabled()
  })

  mintInput.addEventListener('blur', () => {
    const mintAddress = mintInput.value.trim()

    if (
      mintAddress &&
      mintAddress !== verifiedMint &&
      isValidMintAddress(mintAddress)
    ) {
      void runVerification()
    }
  })

  verifyButton.addEventListener('click', () => {
    void runVerification()
  })

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
    updateSubmitEnabled()
  })

  function openModal(): void {
    resetForm()
    modal.hidden = false
    modal.setAttribute('aria-hidden', 'false')
    mintInput.focus()
  }

  function closeModal(): void {
    modal.hidden = true
    modal.setAttribute('aria-hidden', 'true')
    resetForm()
  }

  function resetForm(): void {
    form.reset()
    resetVerification()
    hideError()
  }

  function resetVerification(): void {
    verifiedResult = null
    verifiedMint = ''
    isDuplicateMint = false
    verifyStatus.textContent = ''
    verifyStatus.className = 'submit-launch-verify-status'
    clearSubmitLaunchPreview(preview)
    updateSubmitEnabled()
  }

  function markDuplicateMint(): void {
    verifiedResult = null
    verifiedMint = ''
    isDuplicateMint = true
    clearSubmitLaunchPreview(preview)
    setVerifyStatus('This mint is already listed.', 'is-error')
    updateSubmitEnabled()
  }

  function failVerification(message: string): void {
    verifiedResult = null
    verifiedMint = ''
    isDuplicateMint = false
    clearSubmitLaunchPreview(preview)
    setVerifyStatus(message, 'is-error')
    updateSubmitEnabled()
  }

  function hideError(): void {
    errorElement.hidden = true
    errorElement.textContent = ''
  }

  function showError(message: string): void {
    errorElement.hidden = false
    errorElement.textContent = message
  }

  function setVerifyStatus(message: string, className = ''): void {
    verifyStatus.textContent = message
    verifyStatus.className = `submit-launch-verify-status ${className}`.trim()
  }

  function updateSubmitEnabled(): void {
    const mintAddress = mintInput.value.trim()
    const launchDate = form.querySelector<HTMLInputElement>(
      '[data-submit-launch-date]',
    )?.value.trim()

    const mintVerified =
      Boolean(verifiedResult) &&
      verifiedMint === mintAddress &&
      canSubmitVerifiedMint(verifiedResult)

    const canSubmit =
      mintVerified &&
      !isDuplicateMint &&
      Boolean(launchDate)

    submitButton.disabled = !canSubmit
  }

  async function runVerification(): Promise<void> {
    if (verifyInFlight) {
      return
    }

    hideError()

    const mintAddress = mintInput.value.trim()

    if (!mintAddress) {
      failVerification('Enter a mint address first.')
      return
    }

    if (!isValidMintAddress(mintAddress)) {
      failVerification('Invalid mint address format.')
      return
    }

    if (isMintAlreadyListed(mintAddress, getCatalog())) {
      markDuplicateMint()
      return
    }

    verifyInFlight = true
    verifyButton.disabled = true
    verifiedResult = null
    verifiedMint = ''
    setVerifyStatus('Verifying mint and metadata…', 'is-checking')
    clearSubmitLaunchPreview(preview)
    updateSubmitEnabled()

    try {
      const result = await loadMintVerification(mintAddress, {
        forceRefresh: true,
      })

      if (!result.exists) {
        failVerification('Mint not found on Solana.')
        return
      }

      if (!result.metadataFound) {
        failVerification('On-chain metadata account not found.')
        return
      }

      if (result.error) {
        failVerification(result.error)
        return
      }

      if (isMintAlreadyListed(mintAddress, getCatalog())) {
        markDuplicateMint()
        return
      }

      verifiedResult = result
      isDuplicateMint = false
      verifiedMint = mintAddress

      applySubmitLaunchPreview(preview, result)

      if (result.metadataJsonLoaded) {
        setVerifyStatus('Mint and metadata verified.', 'is-success')
      } else {
        setVerifyStatus(
          'Mint verified. Metadata JSON unavailable — preview uses on-chain fields.',
          'is-success',
        )
      }

      updateSubmitEnabled()
    } catch {
      failVerification('Verification failed. Try again.')
    } finally {
      verifyInFlight = false
      verifyButton.disabled = false
    }
  }

  async function handleSubmit(): Promise<void> {
    if (isDuplicateMint || submitButton.disabled) {
      return
    }

    hideError()

    const mintAddress = mintInput.value.trim()

    if (isMintAlreadyListed(mintAddress, getCatalog())) {
      markDuplicateMint()
      showError('This mint is already listed.')
      return
    }

    if (
      !canSubmitVerifiedMint(verifiedResult) ||
      verifiedMint !== mintAddress
    ) {
      showError('Verify mint and metadata before submitting.')
      return
    }

    const values = readFormValues()
    const validation = validateEditableLaunchFields({
      status: values.status,
      section: values.section,
      launchDate: values.launchDate,
    })

    if (!validation.valid) {
      showError(validation.error ?? 'Invalid launch details.')
      return
    }

    const record: SubmittedLaunchRecord = {
      id: createSubmittedLaunchId(values.mintAddress),
      mintAddress: values.mintAddress,
      section: values.section,
      status: values.status,
      launchDate: values.launchDate,
      submittedAt: Date.now(),
      tokenName:
        verifiedResult!.jsonName ??
        verifiedResult!.metadataName,
      tokenSymbol:
        verifiedResult!.jsonSymbol ??
        verifiedResult!.metadataSymbol,
    }

    const saved = saveSubmittedLaunchRecord(record)

    if (!saved) {
      showError('Could not save launch. Check your launch details and try again.')
      return
    }

    closeModal()
    onSubmitted()
  }

  function readFormValues(): SubmitLaunchFormValues {
    return {
      mintAddress: mintInput.value.trim(),
      section: form.querySelector<HTMLSelectElement>(
        '[data-submit-section]',
      )!.value as LaunchSection,
      status: form.querySelector<HTMLSelectElement>(
        '[data-submit-status]',
      )!.value as LaunchStatus,
      launchDate:
        form.querySelector<HTMLInputElement>(
          '[data-submit-launch-date]',
        )?.value.trim() ?? '',
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
