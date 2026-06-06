import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'
import { formatLaunchInterestButtonText } from '../utils/launchInterestLabel'
import {
  hasVotedForLaunchInterest,
  markLaunchInterestVoted,
} from '../services/launchInterestStorage'
import { postLaunchInterest } from '../services/launchInterestService'

export function renderLaunchInterestControl(
  launch: Launch,
  options: { variant?: 'card' | 'detail' } = {},
): string {
  const variant = options.variant ?? 'card'
  const mintAddress = launch.mintAddress.trim()
  const count = Math.max(0, launch.interestCount ?? 0)
  const hasVoted = hasVotedForLaunchInterest(mintAddress)
  const label = formatLaunchInterestButtonText(count)
  const variantClass =
    variant === 'detail'
      ? ' launch-interest-control--detail'
      : ' launch-interest-control--card'

  return `
    <div
      class="launch-interest-control${variantClass}"
      data-launch-interest-control
      data-launch-id="${escapeHtml(launch.id)}"
      data-mint-address="${escapeHtml(mintAddress)}"
    >
      <button
        type="button"
        class="secondary-btn launch-interest-btn"
        data-launch-interest-btn
        data-mint-address="${escapeHtml(mintAddress)}"
        ${hasVoted ? 'disabled aria-disabled="true"' : ''}
        aria-label="${escapeHtml(label)}"
      >
        ${escapeHtml(label)}
      </button>
      <p
        class="launch-interest-feedback"
        data-launch-interest-feedback
        hidden
        aria-live="polite"
      ></p>
    </div>
  `
}

export function attachLaunchInterestControl(launch: Launch): void {
  const root = document.querySelector<HTMLElement>(
    `[data-launch-interest-control][data-launch-id="${launch.id}"]`,
  )

  if (!root) {
    return
  }

  const button = root.querySelector<HTMLButtonElement>(
    '[data-launch-interest-btn]',
  )
  const feedback = root.querySelector<HTMLElement>(
    '[data-launch-interest-feedback]',
  )

  if (!button || button.disabled) {
    return
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation()
    void handleLaunchInterestVote(launch, button, feedback)
  })
}

function updateLaunchInterestButton(
  button: HTMLButtonElement,
  count: number,
  voted: boolean,
): void {
  button.textContent = formatLaunchInterestButtonText(count)
  button.setAttribute('aria-label', formatLaunchInterestButtonText(count))

  if (voted) {
    button.disabled = true
    button.setAttribute('aria-disabled', 'true')
  }
}

async function handleLaunchInterestVote(
  launch: Launch,
  button: HTMLButtonElement,
  feedback: HTMLElement | null,
): Promise<void> {
  if (button.disabled) {
    return
  }

  button.disabled = true

  const result = await postLaunchInterest(launch.mintAddress)

  if (!result.ok) {
    button.disabled = false

    if (feedback) {
      feedback.hidden = false
      feedback.textContent = result.message
    }

    return
  }

  launch.interestCount = result.interestCount
  markLaunchInterestVoted(result.mintAddress)
  updateLaunchInterestButton(button, result.interestCount, true)

  if (feedback) {
    feedback.hidden = true
    feedback.textContent = ''
  }
}
