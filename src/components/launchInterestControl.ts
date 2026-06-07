import type { Launch } from '../types/launch'
import { escapeHtml } from '../utils/html'
import { formatLaunchInterestButtonText } from '../utils/launchInterestLabel'
import {
  hasVotedForLaunchInterest,
  markLaunchInterestVoted,
} from '../services/launchInterestStorage'
import { appendLaunchActivityLogEntry } from '../services/launchActivityLog'
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

export function attachLaunchInterestControl(
  launch: Launch,
  scope: ParentNode = document,
): void {
  const roots = scope.querySelectorAll<HTMLElement>(
    `[data-launch-interest-control][data-launch-id="${launch.id}"]`,
  )

  for (const root of roots) {
    const button = root.querySelector<HTMLButtonElement>(
      '[data-launch-interest-btn]',
    )
    const feedback = root.querySelector<HTMLElement>(
      '[data-launch-interest-feedback]',
    )

    if (!button || button.disabled) {
      continue
    }

    button.addEventListener('click', (event) => {
      event.stopPropagation()
      void handleLaunchInterestVote(launch, button, feedback, roots)
    })
  }
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
  allControls: NodeListOf<HTMLElement>,
): Promise<void> {
  if (button.disabled) {
    return
  }

  for (const control of allControls) {
    const controlButton = control.querySelector<HTMLButtonElement>(
      '[data-launch-interest-btn]',
    )

    if (controlButton) {
      controlButton.disabled = true
    }
  }

  const result = await postLaunchInterest(launch.mintAddress)

  if (!result.ok) {
    for (const control of allControls) {
      const controlButton = control.querySelector<HTMLButtonElement>(
        '[data-launch-interest-btn]',
      )

      if (controlButton && !hasVotedForLaunchInterest(launch.mintAddress)) {
        controlButton.disabled = false
      }
    }

    if (feedback) {
      feedback.hidden = false
      feedback.textContent = result.message
    }

    return
  }

  launch.interestCount = result.interestCount
  markLaunchInterestVoted(result.mintAddress)
  appendLaunchActivityLogEntry({
    type: 'interest_vote_received',
    launchId: launch.id,
    occurredAt: new Date().toISOString(),
  })

  for (const control of allControls) {
    const controlButton = control.querySelector<HTMLButtonElement>(
      '[data-launch-interest-btn]',
    )
    const controlFeedback = control.querySelector<HTMLElement>(
      '[data-launch-interest-feedback]',
    )

    if (controlButton) {
      updateLaunchInterestButton(controlButton, result.interestCount, true)
    }

    if (controlFeedback) {
      controlFeedback.hidden = true
      controlFeedback.textContent = ''
    }
  }
}
