import type { Launch } from '../types/launch'
import {
  getLaunchDisplayName,
  getLaunchDisplaySymbol,
} from './applyLaunchCardMetadata'
import { getLaunchById } from '../services/launchService'
import { escapeHtml } from '../utils/html'
import { isExternalLink } from '../utils/externalLink'

const QUOTE_TOKEN_OPTIONS = ['SOL', 'USDC', 'BONK'] as const

export function renderCreatePoolModal(): string {
  return `
    <div
      class="submit-launch-modal create-pool-modal"
      data-create-pool-modal
      hidden
      aria-hidden="true"
    >
      <div
        class="submit-launch-backdrop"
        data-create-pool-close
        aria-hidden="true"
      ></div>
      <div
        class="submit-launch-dialog create-pool-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-pool-title"
      >
        <button
          type="button"
          class="submit-launch-close"
          data-create-pool-close
          aria-label="Close"
        >
          ×
        </button>

        <h2 class="submit-launch-title" id="create-pool-title">
          Create Liquidity Pool
        </h2>

        <div class="create-pool-copy">
          <p class="submit-launch-lead">
            Pool creation is coming soon to CBS Token Launcher.
          </p>
          <p class="create-pool-text">
            Creating a pool requires adding both tokens to a liquidity pair —
            for example, your project token plus a quote token such as SOL.
          </p>
          <p
            class="create-pool-example"
            data-create-pool-example
          >
            Example: TOKEN + SOL
          </p>
          <p class="create-pool-text">
            A future version will connect your wallet to review amounts and
            confirm the transaction on Solana.
          </p>
        </div>

        <form class="submit-launch-form create-pool-form" novalidate>
          <label class="submit-launch-field">
            <span class="submit-launch-label">Base token mint</span>
            <input
              class="submit-launch-input submit-launch-input--readonly"
              type="text"
              data-create-pool-base-mint
              readonly
              tabindex="-1"
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Quote token</span>
            <select
              class="submit-launch-input"
              data-create-pool-quote-token
              disabled
            >
              ${QUOTE_TOKEN_OPTIONS.map(
                (option) =>
                  `<option value="${option}">${option}</option>`,
              ).join('')}
            </select>
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Initial token amount</span>
            <input
              class="submit-launch-input"
              type="text"
              data-create-pool-token-amount
              placeholder="Coming soon"
              disabled
            />
          </label>

          <label class="submit-launch-field">
            <span class="submit-launch-label">Initial quote amount</span>
            <input
              class="submit-launch-input"
              type="text"
              data-create-pool-quote-amount
              placeholder="Coming soon"
              disabled
            />
          </label>
        </form>

        <aside class="create-pool-warning" data-create-pool-warning>
          <p class="create-pool-warning__title">Important</p>
          <p class="create-pool-warning__text">
            Creating liquidity pools has financial risk. Only continue if you
            understand liquidity, impermanent loss, and pool ownership.
          </p>
        </aside>

        <div class="submit-launch-actions">
          <button
            type="button"
            class="primary-btn"
            data-create-pool-close
          >
            Close
          </button>
        </div>
      </div>
    </div>
  `
}

let createPoolHandlersAttached = false
let createPoolEscapeHandlerAttached = false

export function attachCreatePoolModal(): void {
  if (createPoolHandlersAttached) {
    return
  }

  createPoolHandlersAttached = true

  document.querySelector('#app')?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const anchor = target.closest<HTMLAnchorElement>('a[href]')

    if (anchor && isExternalLink(anchor)) {
      return
    }

    const openButton = target.closest<HTMLButtonElement>(
      '[data-open-create-pool]',
    )

    if (openButton) {
      event.preventDefault()
      event.stopPropagation()

      const launchId = openButton.getAttribute('data-open-create-pool')

      if (launchId) {
        openCreatePoolModal(launchId)
      }

      return
    }

    if (target.closest('[data-create-pool-close]')) {
      event.preventDefault()
      closeCreatePoolModal()
    }
  })

  if (!createPoolEscapeHandlerAttached) {
    document.addEventListener('keydown', handleCreatePoolEscapeKey)
    createPoolEscapeHandlerAttached = true
  }
}

function handleCreatePoolEscapeKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape') {
    return
  }

  const modal = document.querySelector<HTMLElement>('[data-create-pool-modal]')

  if (modal && !modal.hidden) {
    closeCreatePoolModal()
  }
}

function openCreatePoolModal(launchId: string): void {
  const launch = getLaunchById(launchId)

  if (!launch) {
    return
  }

  const modal = document.querySelector<HTMLElement>('[data-create-pool-modal]')

  if (!modal) {
    return
  }

  const symbol = getLaunchDisplaySymbol(launch)
  const name = getLaunchDisplayName(launch)
  const exampleLabel =
    symbol && symbol !== '—' ? symbol : name

  setInputValue(modal, '[data-create-pool-base-mint]', launch.mintAddress)

  const exampleElement = modal.querySelector<HTMLElement>(
    '[data-create-pool-example]',
  )

  if (exampleElement) {
    exampleElement.textContent = `Example: ${exampleLabel} + SOL`
  }

  modal.hidden = false
  modal.setAttribute('aria-hidden', 'false')
}

function closeCreatePoolModal(): void {
  const modal = document.querySelector<HTMLElement>('[data-create-pool-modal]')

  if (!modal) {
    return
  }

  modal.hidden = true
  modal.setAttribute('aria-hidden', 'true')
}

function setInputValue(
  root: ParentNode,
  selector: string,
  value: string,
): void {
  const input = root.querySelector<HTMLInputElement>(selector)

  if (input) {
    input.value = value
  }
}

export function renderCreatePoolAction(launch: Launch): string {
  const id = escapeHtml(launch.id)

  return `
    <div class="market-data-create-pool" data-create-pool-action hidden>
      <button
        type="button"
        class="secondary-btn create-pool-btn"
        data-open-create-pool="${id}"
      >
        Create Pool
      </button>
    </div>
  `
}

export function updateCreatePoolActionVisibility(
  root: HTMLElement | null,
  visible: boolean,
): void {
  const action = root?.querySelector<HTMLElement>('[data-create-pool-action]')

  if (!action) {
    return
  }

  action.hidden = !visible
}
