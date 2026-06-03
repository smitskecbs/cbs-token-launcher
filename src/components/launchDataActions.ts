import {
  downloadExportedLaunches,
  importLaunchesFromJson,
  readLaunchesJsonFile,
} from '../services/launchDataTransfer'

let launchDataActionsAttached = false

export function renderLaunchDataActions(): string {
  return `
    <div class="launch-data-actions">
      <button
        type="button"
        class="secondary-btn"
        data-export-launches
      >
        Export Launches
      </button>
      <button
        type="button"
        class="secondary-btn"
        data-import-launches
      >
        Import Launches
      </button>
      <input
        type="file"
        accept=".json,application/json"
        data-import-launches-input
        hidden
      />
      <p
        class="launch-data-status"
        data-launch-data-status
        hidden
        aria-live="polite"
      ></p>
    </div>
  `
}

export function attachLaunchDataActions(
  onCatalogChange: () => void,
): void {
  if (launchDataActionsAttached) {
    return
  }

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const exportButton = target.closest<HTMLButtonElement>(
      '[data-export-launches]',
    )

    if (exportButton) {
      handleExportLaunches(exportButton)
      return
    }

    const importButton = target.closest<HTMLButtonElement>(
      '[data-import-launches]',
    )

    if (importButton) {
      openImportFilePicker(importButton)
    }
  })

  document.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement

    if (!target.matches('[data-import-launches-input]') || !target.files?.[0]) {
      return
    }

    void handleImportLaunches(target.files[0], target, onCatalogChange)
  })

  launchDataActionsAttached = true
}

function findStatusElement(button: HTMLElement): HTMLElement | null {
  return button
    .closest('.launch-data-actions')
    ?.querySelector<HTMLElement>('[data-launch-data-status]') ?? null
}

function showStatus(
  button: HTMLElement,
  message: string,
  type: 'success' | 'error' = 'success',
): void {
  const status = findStatusElement(button)

  if (!status) {
    return
  }

  status.hidden = false
  status.textContent = message
  status.className = `launch-data-status is-${type}`
}

function handleExportLaunches(button: HTMLButtonElement): void {
  const downloaded = downloadExportedLaunches()

  if (!downloaded) {
    showStatus(
      button,
      'No local launches to export.',
      'error',
    )
    return
  }

  showStatus(button, 'Downloaded cbs-launches.json.')
}

function openImportFilePicker(button: HTMLButtonElement): void {
  const input = button
    .closest('.launch-data-actions')
    ?.querySelector<HTMLInputElement>('[data-import-launches-input]')

  if (!input) {
    return
  }

  input.value = ''
  input.click()
}

async function handleImportLaunches(
  file: File,
  input: HTMLInputElement,
  onCatalogChange: () => void,
): Promise<void> {
  const triggerButton = input
    .closest('.launch-data-actions')
    ?.querySelector<HTMLButtonElement>('[data-import-launches]')

  if (!triggerButton) {
    return
  }

  try {
    const raw = await readLaunchesJsonFile(file)
    const result = importLaunchesFromJson(raw)

    if (!result.success) {
      showStatus(
        triggerButton,
        result.errors[0] ?? 'Import failed.',
        'error',
      )
      return
    }

    onCatalogChange()

    const detail = result.skipped > 0
      ? ` Imported ${result.imported}, skipped ${result.skipped}.`
      : ` Imported ${result.imported} launch${result.imported === 1 ? '' : 'es'}.`

    showStatus(
      triggerButton,
      `Launch data restored.${detail}`,
      'success',
    )
  } catch {
    showStatus(
      triggerButton,
      'Could not read JSON file.',
      'error',
    )
  }
}
