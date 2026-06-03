import type { LaunchSection, LaunchStatus, LaunchVerificationLevel } from '../types/launch'
import { getCurrentRoute, navigate } from '../router'
import { getLaunchById } from '../services/launchService'
import {
  getSubmittedLaunchRecordById,
  isLocallyManagedLaunch,
  removeSubmittedLaunchRecord,
  updateSubmittedLaunchRecord,
} from '../services/submittedLaunchesStorage'
import { validateEditableLaunchFields } from '../utils/launchValidation'

export function renderManageLaunchModal(): string {
  return `
    <div
      class="submit-launch-modal"
      data-manage-launch-modal
      hidden
      aria-hidden="true"
    >
      <div
        class="submit-launch-backdrop"
        data-manage-launch-close
        aria-hidden="true"
      ></div>
      <div
        class="submit-launch-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-launch-title"
      >
        <button
          type="button"
          class="submit-launch-close"
          data-manage-launch-close
          aria-label="Close"
        >
          ×
        </button>

        <h2 class="submit-launch-title" id="manage-launch-title">
          Edit Launch
        </h2>
        <p class="submit-launch-lead">
          Update launch listing details. Token metadata is read-only and always
          loaded from the mint.
        </p>

        <form class="submit-launch-form" data-manage-launch-form novalidate>
          <input type="hidden" name="launchId" data-manage-launch-id />

          <label class="submit-launch-field">
            <span class="submit-launch-label">Mint Address</span>
            <input
              class="submit-launch-input submit-launch-input--readonly"
              type="text"
              data-manage-mint
              readonly
              tabindex="-1"
            />
          </label>

          <div class="submit-launch-preview-hint" data-manage-token-label></div>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Launch Status</span>
            <select class="submit-launch-input" name="status" data-manage-status required>
              <option value="preparing">Preparing</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
            </select>
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Launch Section</span>
            <select class="submit-launch-input" name="section" data-manage-section required>
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
              data-manage-launch-date
              placeholder="e.g. Coming soon, Live on Solana"
              required
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Verification Level</span>
            <select
              class="submit-launch-input"
              name="verificationLevel"
              data-manage-verification-level
              required
            >
              <option value="normal">Normal</option>
              <option value="verified">Verified</option>
              <option value="cbs-verified">CBS Verified</option>
            </select>
          </label>

          <p
            class="submit-launch-error"
            data-manage-error
            hidden
            aria-live="polite"
          ></p>

          <div class="submit-launch-actions">
            <button
              type="button"
              class="secondary-btn"
              data-manage-launch-close
            >
              Cancel
            </button>
            <button
              type="submit"
              class="primary-btn"
              data-manage-launch-save
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `
}

interface ManageLaunchModalElements {
  modal: HTMLElement
  form: HTMLFormElement
  launchIdInput: HTMLInputElement
  mintInput: HTMLInputElement
  tokenLabel: HTMLElement
  statusSelect: HTMLSelectElement
  sectionSelect: HTMLSelectElement
  launchDateInput: HTMLInputElement
  verificationLevelSelect: HTMLSelectElement
  errorElement: HTMLElement
}

let manageLaunchGlobalHandlersAttached = false
let manageLaunchEscapeHandlerAttached = false
let manageLaunchOnUpdated: (() => void) | null = null

export function attachManageLaunchModal(
  onUpdated: () => void,
): void {
  manageLaunchOnUpdated = onUpdated

  const modal = document.querySelector<HTMLElement>(
    '[data-manage-launch-modal]',
  )

  if (!modal) {
    return
  }

  const form = modal.querySelector<HTMLFormElement>(
    '[data-manage-launch-form]',
  )
  const launchIdInput = modal.querySelector<HTMLInputElement>(
    '[data-manage-launch-id]',
  )
  const mintInput = modal.querySelector<HTMLInputElement>(
    '[data-manage-mint]',
  )
  const tokenLabel = modal.querySelector<HTMLElement>(
    '[data-manage-token-label]',
  )
  const statusSelect = modal.querySelector<HTMLSelectElement>(
    '[data-manage-status]',
  )
  const sectionSelect = modal.querySelector<HTMLSelectElement>(
    '[data-manage-section]',
  )
  const launchDateInput = modal.querySelector<HTMLInputElement>(
    '[data-manage-launch-date]',
  )
  const verificationLevelSelect = modal.querySelector<HTMLSelectElement>(
    '[data-manage-verification-level]',
  )
  const errorElement = modal.querySelector<HTMLElement>(
    '[data-manage-error]',
  )

  if (
    !form ||
    !launchIdInput ||
    !mintInput ||
    !tokenLabel ||
    !statusSelect ||
    !sectionSelect ||
    !launchDateInput ||
    !verificationLevelSelect ||
    !errorElement
  ) {
    return
  }

  wireManageLaunchModal({
    modal,
    form,
    launchIdInput,
    mintInput,
    tokenLabel,
    statusSelect,
    sectionSelect,
    launchDateInput,
    verificationLevelSelect,
    errorElement,
  })

  if (!manageLaunchGlobalHandlersAttached) {
    document.addEventListener('click', handleManageLaunchDocumentClick)
    manageLaunchGlobalHandlersAttached = true
  }
}

function handleManageLaunchDocumentClick(event: Event): void {
  const target = event.target as HTMLElement
  const editButton = target.closest<HTMLButtonElement>(
    '[data-edit-launch]',
  )

  if (editButton) {
    event.stopPropagation()
    const launchId = editButton.getAttribute('data-edit-launch')

    if (launchId) {
      openManageLaunchEditModal(launchId)
    }

    return
  }

  const removeButton = target.closest<HTMLButtonElement>(
    '[data-remove-launch]',
  )

  if (removeButton) {
    event.stopPropagation()
    const launchId = removeButton.getAttribute('data-remove-launch')

    if (launchId) {
      handleManageLaunchRemove(launchId)
    }
  }
}

let activeManageLaunchModal: ManageLaunchModalElements | null = null

function wireManageLaunchModal(ui: ManageLaunchModalElements): void {
  activeManageLaunchModal = ui

  for (const closeTarget of ui.modal.querySelectorAll(
    '[data-manage-launch-close]',
  )) {
    closeTarget.addEventListener('click', () => {
      closeManageLaunchModal()
    })
  }

  ui.form.addEventListener('submit', (event) => {
    event.preventDefault()
    saveManageLaunchChanges()
  })

  if (!manageLaunchEscapeHandlerAttached) {
    document.addEventListener('keydown', handleManageLaunchEscapeKey)
    manageLaunchEscapeHandlerAttached = true
  }
}

function handleManageLaunchEscapeKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !activeManageLaunchModal) {
    return
  }

  if (!activeManageLaunchModal.modal.hidden) {
    closeManageLaunchModal()
  }
}

function openManageLaunchEditModal(launchId: string): void {
  const ui = activeManageLaunchModal

  if (!ui) {
    return
  }

  hideManageLaunchError(ui)

  const launch = getLaunchById(launchId)

  if (!launch || !isLocallyManagedLaunch(launch)) {
    return
  }

  const record = getSubmittedLaunchRecordById(launchId)

  ui.launchIdInput.value = launchId
  ui.mintInput.value = launch.mintAddress

  const name = launch.name ?? record?.tokenName ?? 'Token'
  const symbol = launch.symbol ?? record?.tokenSymbol ?? ''

  ui.tokenLabel.textContent = symbol
    ? `Metadata: ${name} (${symbol}) — read-only from mint`
    : `Metadata: ${name} — read-only from mint`

  ui.statusSelect.value = launch.status
  ui.sectionSelect.value = launch.section
  ui.launchDateInput.value =
    record?.launchDate ?? launch.launchInfo.launchDate
  ui.verificationLevelSelect.value =
    launch.verificationLevel ?? record?.verificationLevel ?? 'normal'

  ui.modal.hidden = false
  ui.modal.setAttribute('aria-hidden', 'false')
  ui.launchDateInput.focus()
}

function closeManageLaunchModal(): void {
  const ui = activeManageLaunchModal

  if (!ui) {
    return
  }

  ui.modal.hidden = true
  ui.modal.setAttribute('aria-hidden', 'true')
  ui.form.reset()
  hideManageLaunchError(ui)
}

function hideManageLaunchError(ui: ManageLaunchModalElements): void {
  ui.errorElement.hidden = true
  ui.errorElement.textContent = ''
}

function showManageLaunchError(
  ui: ManageLaunchModalElements,
  message: string,
): void {
  ui.errorElement.hidden = false
  ui.errorElement.textContent = message
}

function saveManageLaunchChanges(): void {
  const ui = activeManageLaunchModal

  if (!ui) {
    return
  }

  hideManageLaunchError(ui)

  const launchId = ui.launchIdInput.value.trim()
  const launchDate = ui.launchDateInput.value.trim()
  const validation = validateEditableLaunchFields({
    status: ui.statusSelect.value,
    section: ui.sectionSelect.value,
    launchDate,
    verificationLevel: ui.verificationLevelSelect.value,
  })

  if (!launchId) {
    showManageLaunchError(ui, 'Launch not found.')
    return
  }

  if (!validation.valid) {
    showManageLaunchError(ui, validation.error ?? 'Invalid launch details.')
    return
  }

  const updated = updateSubmittedLaunchRecord(launchId, {
    status: ui.statusSelect.value as LaunchStatus,
    section: ui.sectionSelect.value as LaunchSection,
    launchDate,
    verificationLevel:
      ui.verificationLevelSelect.value as LaunchVerificationLevel,
  })

  if (!updated) {
    showManageLaunchError(
      ui,
      'Could not update launch. It may have been removed.',
    )
    return
  }

  closeManageLaunchModal()
  manageLaunchOnUpdated?.()
}

function handleManageLaunchRemove(launchId: string): void {
  const launch = getLaunchById(launchId)

  if (!launch || !isLocallyManagedLaunch(launch)) {
    return
  }

  const name = launch.name ?? launch.symbol ?? launch.mintAddress
  const confirmed = window.confirm(
    `Remove "${name}" from the launchpad?\n\nThis only removes the local listing. The token mint on Solana is unchanged.`,
  )

  if (!confirmed) {
    return
  }

  if (!removeSubmittedLaunchRecord(launchId)) {
    window.alert('Could not remove launch.')
    return
  }

  closeManageLaunchModal()

  const route = getCurrentRoute()

  if (route.name === 'token' && route.tokenId === launchId) {
    navigate('/')
    return
  }

  manageLaunchOnUpdated?.()
}
