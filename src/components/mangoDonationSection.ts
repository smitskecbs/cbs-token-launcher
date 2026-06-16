import { escapeHtml } from '../utils/html'

export const MANGO_DONATION_WALLET =
  'ManGofryUWC5VWk7t4ATP32qJtGVBBNoVi2AQ9HyR9J'

export function renderMangoDonationSection(): string {
  const wallet = escapeHtml(MANGO_DONATION_WALLET)

  return `
    <section
      class="support-section page-section mango-donation-section"
      aria-labelledby="support-cbs-ecosystem-title"
    >
      <div class="support-card mango-donation-card">
        <h2 class="support-title mango-donation-title" id="support-cbs-ecosystem-title">
          Support CBS Ecosystem
        </h2>
        <p class="support-text mango-donation-text">
          Optional donations help fund development and infrastructure.
        </p>
        <code
          class="support-wallet mango-donation-wallet"
          data-mango-donation-wallet
        >${wallet}</code>
        <button
          type="button"
          class="secondary-btn support-copy-btn mango-donation-copy-btn"
          data-mango-donation-copy
        >
          Copy address
        </button>
        <p
          class="support-confirm mango-donation-confirm"
          data-mango-donation-confirm
          hidden
          aria-live="polite"
        >
          Address copied.
        </p>
      </div>
    </section>
  `
}

export function attachMangoDonationSection(): void {
  const button = document.querySelector<HTMLButtonElement>(
    '[data-mango-donation-copy]',
  )
  const confirm = document.querySelector<HTMLElement>(
    '[data-mango-donation-confirm]',
  )

  if (!button || !confirm) {
    return
  }

  let confirmTimeoutId: number | undefined

  button.addEventListener('click', () => {
    void copyDonationWallet(confirm, () => {
      if (confirmTimeoutId !== undefined) {
        window.clearTimeout(confirmTimeoutId)
      }

      confirmTimeoutId = window.setTimeout(() => {
        confirm.hidden = true
        confirm.textContent = 'Address copied.'
      }, 2400)
    })
  })
}

async function copyDonationWallet(
  confirm: HTMLElement,
  onShown: () => void,
): Promise<void> {
  const wallet = MANGO_DONATION_WALLET

  try {
    await navigator.clipboard.writeText(wallet)
    confirm.hidden = false
    confirm.textContent = 'Address copied.'
    onShown()
  } catch {
    confirm.hidden = false
    confirm.textContent =
      'Copy failed. Select the wallet address above and copy manually.'
    onShown()
  }
}
