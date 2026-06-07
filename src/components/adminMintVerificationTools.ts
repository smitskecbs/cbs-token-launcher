import {
  getOrbAddressUrl,
  getSolanaExplorerAddressUrl,
  getSolscanTokenUrl,
} from '../config/urls'
import { escapeHtml } from '../utils/html'

const COPY_MINT_LABEL = 'Copy Mint'
const COPIED_LABEL = 'Copied'
const COPY_RESET_MS = 2000

export function renderAdminMintVerificationTools(mintAddress: string): string {
  const trimmedMint = mintAddress.trim()

  if (!trimmedMint) {
    return ''
  }

  const mint = escapeHtml(trimmedMint)
  const solscanUrl = escapeHtml(getSolscanTokenUrl(trimmedMint))
  const explorerUrl = escapeHtml(getSolanaExplorerAddressUrl(trimmedMint))
  const orbUrl = escapeHtml(getOrbAddressUrl(trimmedMint))

  return `
    <div class="admin-mint-verification" data-admin-mint-verification>
      <code class="admin-submissions-mint">${mint}</code>
      <div class="admin-mint-verification__actions">
        <button
          type="button"
          class="admin-mint-verification__btn"
          data-admin-copy-mint
          data-mint-address="${mint}"
        >
          ${COPY_MINT_LABEL}
        </button>
        <a
          class="admin-mint-verification__link"
          href="${solscanUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >Solscan</a>
        <a
          class="admin-mint-verification__link"
          href="${explorerUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >Explorer</a>
        <a
          class="admin-mint-verification__link"
          href="${orbUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >ORB</a>
      </div>
    </div>
  `
}

export function attachAdminMintVerificationTools(root: ParentNode): void {
  if (
    root instanceof HTMLElement &&
    root.dataset.adminMintVerificationBound === 'true'
  ) {
    return
  }

  if (root instanceof HTMLElement) {
    root.dataset.adminMintVerificationBound = 'true'
  }

  root.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-admin-copy-mint]',
    )

    if (!button || button.disabled) {
      return
    }

    const mintAddress = button.getAttribute('data-mint-address')?.trim() ?? ''

    if (!mintAddress) {
      return
    }

    void copyAdminMintAddress(button, mintAddress)
  })
}

async function copyAdminMintAddress(
  button: HTMLButtonElement,
  mintAddress: string,
): Promise<void> {
  const existingTimeoutId = Number(button.dataset.copyResetTimeoutId)

  if (existingTimeoutId) {
    window.clearTimeout(existingTimeoutId)
  }

  try {
    await navigator.clipboard.writeText(mintAddress)
    button.textContent = COPIED_LABEL
    button.classList.add('admin-mint-verification__btn--copied')
    button.disabled = true

    const timeoutId = window.setTimeout(() => {
      button.textContent = COPY_MINT_LABEL
      button.classList.remove('admin-mint-verification__btn--copied')
      button.disabled = false
      delete button.dataset.copyResetTimeoutId
    }, COPY_RESET_MS)

    button.dataset.copyResetTimeoutId = String(timeoutId)
  } catch {
    button.textContent = 'Copy failed'
    button.classList.add('admin-mint-verification__btn--error')

    const timeoutId = window.setTimeout(() => {
      button.textContent = COPY_MINT_LABEL
      button.classList.remove('admin-mint-verification__btn--error')
      delete button.dataset.copyResetTimeoutId
    }, COPY_RESET_MS)

    button.dataset.copyResetTimeoutId = String(timeoutId)
  }
}
