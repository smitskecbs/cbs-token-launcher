import { escapeHtml } from '../utils/html'

export const MANGO_DONATION_WALLET =
  'ManGofryUWC5VWk7t4ATP32qJtGVBBNoVi2AQ9HyR9J'

export function renderMangoDonationSection(): string {
  const wallet = escapeHtml(MANGO_DONATION_WALLET)

  return `
    <section
      class="mango-donation-section page-section"
      aria-labelledby="mango-donation-title"
    >
      <div class="mango-donation-card">
        <h2 class="mango-donation-title" id="mango-donation-title">
          Support CBS Ecosystem Development
        </h2>
        <p class="mango-donation-text">
          Donations help fund development, infrastructure, liquidity, and future CBS ecosystem tools.
        </p>
        <ul class="mango-donation-points" aria-label="What support helps fund">
          <li>Liquidity</li>
          <li>Development</li>
          <li>Launch tools</li>
        </ul>
        <p class="mango-donation-wallet-label">Wallet address</p>
        <code
          class="mango-donation-wallet"
          data-mango-donation-wallet
        >${wallet}</code>
        <button
          type="button"
          class="secondary-btn mango-donation-copy-btn"
          data-mango-donation-copy
        >
          Copy Address
        </button>
        <p
          class="mango-donation-confirm"
          data-mango-donation-confirm
          hidden
          aria-live="polite"
        >
          Address copied.
        </p>
        <p class="mango-donation-disclaimer">
          No promises. No pressure. Only support if you believe in the build.
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
