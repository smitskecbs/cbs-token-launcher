import type { LaunchUpdate } from '../types/launchUpdate'
import type { LaunchUpdateTarget } from '../utils/launchUpdateTarget'
import {
  createLaunchUpdate,
  deleteLaunchUpdate,
  fetchLaunchUpdates,
} from '../services/launchUpdatesService'
import { escapeHtml } from '../utils/html'

export interface AdminManageUpdatesModalHandlers {
  onUnauthorized: (message: string) => void
}

function formatUpdateDate(iso: string): string {
  const parsed = new Date(iso)

  if (Number.isNaN(parsed.getTime())) {
    return iso
  }

  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function renderExistingUpdates(updates: LaunchUpdate[]): string {
  if (updates.length === 0) {
    return `
      <p class="admin-updates-empty" data-admin-updates-empty>
        No updates posted yet.
      </p>
    `
  }

  return `
    <ul class="admin-updates-list" data-admin-updates-list>
      ${updates
        .map(
          (update) => `
            <li class="admin-updates-item" data-admin-update-item="${escapeHtml(update.id)}">
              <div class="admin-updates-item__meta">
                <time datetime="${escapeHtml(update.createdAt)}">
                  ${escapeHtml(formatUpdateDate(update.createdAt))}
                </time>
                <h3 class="admin-updates-item__title">${escapeHtml(update.title)}</h3>
              </div>
              <p class="admin-updates-item__content">${escapeHtml(update.content)}</p>
              <button
                type="button"
                class="secondary-btn admin-updates-delete"
                data-admin-delete-update
                data-update-id="${escapeHtml(update.id)}"
              >
                Delete update
              </button>
            </li>
          `,
        )
        .join('')}
    </ul>
  `
}

export function renderAdminManageUpdatesModal(): string {
  return `
    <div
      class="submit-launch-modal"
      data-admin-manage-updates-modal
      hidden
      aria-hidden="true"
    >
      <div
        class="submit-launch-backdrop"
        data-admin-manage-updates-close
        aria-hidden="true"
      ></div>
      <div
        class="submit-launch-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-manage-updates-title"
      >
        <button
          type="button"
          class="submit-launch-close"
          data-admin-manage-updates-close
          aria-label="Close"
        >
          ×
        </button>

        <h2 class="submit-launch-title" id="admin-manage-updates-title">
          Manage Updates
        </h2>
        <p class="submit-launch-lead" data-admin-manage-updates-target-label></p>

        <form class="submit-launch-form" data-admin-manage-updates-form novalidate>
          <label class="submit-launch-field">
            <span class="submit-launch-label">Title</span>
            <input
              class="submit-launch-input"
              type="text"
              name="title"
              data-admin-update-title
              maxlength="200"
              required
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Update text</span>
            <textarea
              class="submit-launch-input"
              name="content"
              data-admin-update-content
              rows="5"
              maxlength="5000"
              required
            ></textarea>
          </label>

          <p
            class="admin-submissions-state admin-submissions-state--error"
            data-admin-manage-updates-error
            hidden
            aria-live="polite"
          ></p>

          <div class="submit-launch-actions">
            <button
              type="submit"
              class="primary-btn"
              data-admin-manage-updates-save
            >
              Save
            </button>
            <button
              type="button"
              class="secondary-btn"
              data-admin-manage-updates-close
            >
              Close
            </button>
          </div>
        </form>

        <div class="admin-updates-existing" data-admin-updates-existing>
          <h3 class="admin-updates-existing__heading">Posted updates</h3>
          <p
            class="admin-submissions-state admin-submissions-state--loading"
            data-admin-updates-loading
            hidden
            aria-live="polite"
          >
            Loading updates…
          </p>
          <div data-admin-updates-existing-list></div>
        </div>
      </div>
    </div>
  `
}

export function attachAdminManageUpdatesModal(
  handlers: AdminManageUpdatesModalHandlers,
): { openManageUpdatesModal: (target: LaunchUpdateTarget) => void } {
  const modal = document.querySelector<HTMLElement>(
    '[data-admin-manage-updates-modal]',
  )
  const targetLabel = document.querySelector<HTMLElement>(
    '[data-admin-manage-updates-target-label]',
  )
  const form = document.querySelector<HTMLFormElement>(
    '[data-admin-manage-updates-form]',
  )
  const titleInput = document.querySelector<HTMLInputElement>(
    '[data-admin-update-title]',
  )
  const contentInput = document.querySelector<HTMLTextAreaElement>(
    '[data-admin-update-content]',
  )
  const error = document.querySelector<HTMLElement>(
    '[data-admin-manage-updates-error]',
  )
  const saveButton = document.querySelector<HTMLButtonElement>(
    '[data-admin-manage-updates-save]',
  )
  const loading = document.querySelector<HTMLElement>(
    '[data-admin-updates-loading]',
  )
  const existingList = document.querySelector<HTMLElement>(
    '[data-admin-updates-existing-list]',
  )
  const existingRoot = document.querySelector<HTMLElement>(
    '[data-admin-updates-existing]',
  )

  if (
    !modal ||
    !targetLabel ||
    !form ||
    !titleInput ||
    !contentInput ||
    !error ||
    !saveButton ||
    !loading ||
    !existingList ||
    !existingRoot
  ) {
    return {
      openManageUpdatesModal: () => {},
    }
  }

  const modalEl = modal
  const targetLabelEl = targetLabel
  const formEl = form
  const titleInputEl = titleInput
  const contentInputEl = contentInput
  const errorEl = error
  const saveButtonEl = saveButton
  const loadingEl = loading
  const existingListEl = existingList
  const existingRootEl = existingRoot

  let activeTarget: LaunchUpdateTarget | null = null
  let loadedUpdates: LaunchUpdate[] = []
  let saveInFlight = false
  let deleteInFlight = false

  function setError(message: string): void {
    errorEl.hidden = false
    errorEl.textContent = message
  }

  function clearError(): void {
    errorEl.hidden = true
    errorEl.textContent = ''
  }

  function closeModal(): void {
    modalEl.hidden = true
    modalEl.setAttribute('aria-hidden', 'true')
    activeTarget = null
    formEl.reset()
    clearError()
  }

  function renderUpdatesList(): void {
    existingListEl.innerHTML = renderExistingUpdates(loadedUpdates)
  }

  async function loadUpdates(): Promise<void> {
    if (!activeTarget) {
      return
    }

    loadingEl.hidden = false
    existingListEl.innerHTML = ''

    const result = await fetchLaunchUpdates(activeTarget)

    loadingEl.hidden = true

    if (!result.ok) {
      existingListEl.innerHTML = `
        <p class="admin-submissions-state admin-submissions-state--error">
          ${escapeHtml(result.message)}
        </p>
      `
      loadedUpdates = []
      return
    }

    loadedUpdates = result.updates
    renderUpdatesList()
  }

  async function openManageUpdatesModal(target: LaunchUpdateTarget): Promise<void> {
    activeTarget = target
    targetLabelEl.textContent = `Post updates for ${target.label}.`
    formEl.reset()
    clearError()
    modalEl.hidden = false
    modalEl.setAttribute('aria-hidden', 'false')
    titleInputEl.focus()
    await loadUpdates()
  }

  for (const closeTrigger of document.querySelectorAll<HTMLElement>(
    '[data-admin-manage-updates-close]',
  )) {
    closeTrigger.addEventListener('click', closeModal)
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modalEl.hidden) {
      closeModal()
    }
  })

  formEl.addEventListener('submit', (event) => {
    event.preventDefault()
    void handleSave()
  })

  existingRootEl.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const deleteButton = target.closest<HTMLButtonElement>(
      '[data-admin-delete-update]',
    )

    if (!deleteButton || deleteButton.disabled) {
      return
    }

    const updateId = deleteButton.getAttribute('data-update-id')

    if (updateId) {
      void handleDelete(updateId)
    }
  })

  async function handleSave(): Promise<void> {
    if (!activeTarget || saveInFlight) {
      return
    }

    const title = titleInputEl.value.trim()
    const content = contentInputEl.value.trim()

    if (!title) {
      setError('Title is required.')
      return
    }

    if (!content) {
      setError('Update text is required.')
      return
    }

    saveInFlight = true
    saveButtonEl.disabled = true
    clearError()

    const result = await createLaunchUpdate(activeTarget, { title, content })

    saveInFlight = false
    saveButtonEl.disabled = false

    if (!result.ok) {
      if (result.unauthorized) {
        handlers.onUnauthorized(result.message)
        closeModal()
        return
      }

      setError(result.message)
      return
    }

    loadedUpdates = [result.update, ...loadedUpdates]
    renderUpdatesList()
    formEl.reset()
    titleInputEl.focus()
  }

  async function handleDelete(updateId: string): Promise<void> {
    if (deleteInFlight) {
      return
    }

    deleteInFlight = true
    clearError()

    const result = await deleteLaunchUpdate(updateId)

    deleteInFlight = false

    if (!result.ok) {
      if (result.unauthorized) {
        handlers.onUnauthorized(result.message)
        closeModal()
        return
      }

      setError(result.message)
      return
    }

    loadedUpdates = loadedUpdates.filter((update) => update.id !== updateId)
    renderUpdatesList()
  }

  return {
    openManageUpdatesModal: (target) => {
      void openManageUpdatesModal(target)
    },
  }
}
