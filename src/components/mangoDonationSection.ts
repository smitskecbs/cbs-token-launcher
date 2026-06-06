import { escapeHtml } from '../utils/html'

export const MANGO_DONATION_WALLET = 'REPLACE_WITH_MANGO_WALLET_ADDRESS'

export function renderMangoDonationSection(): string {
  return `
    <section
      class="mango-donation-section"
      aria-labelledby="mango-donation-title"
    >
      <div class="mango-donation-card">
        <h2 class="mango-donation-title" id="mango-donation-title">
          Support ManGo liquidity
        </h2>
        <p class="mango-donation-text">
          Optional donations help fund future pool growth and ecosystem building.
        </p>
        <p class="mango-donation-note">
          Donations are optional and not required to use the launcher.
        </p>
        <button
          type="button"
          class="secondary-btn mango-donation-copy-btn"
          data-mango-donation-copy
        >
          Copy donation wallet
        </button>
        <p
          class="mango-donation-confirm"
          data-mango-donation-confirm
          hidden
          aria-live="polite"
        >
          Wallet address copied.
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
        confirm.textContent = 'Wallet address copied.'
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
    confirm.textContent = 'Wallet address copied.'
    onShown()
  } catch {
    confirm.hidden = false
    confirm.textContent = `Copy failed. Wallet: ${escapeHtml(wallet)}`
    onShown()
  }
}
