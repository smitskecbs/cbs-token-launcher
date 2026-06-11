const LOG_PREFIX = '[telegram-notify]'
const ADMIN_SUBMISSIONS_URL =
  'https://token-launcher.cbs-coin.com/admin/submissions'
const TELEGRAM_API_BASE = 'https://api.telegram.org'

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function formatSubmittedAt(isoString) {
  const parsed = new Date(isoString)

  if (Number.isNaN(parsed.getTime())) {
    return isoString || 'Unknown'
  }

  return `${parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  })} UTC`
}

function buildSubmissionNotificationText(record) {
  const lines = [
    'New launch submission',
    '',
    `Project: ${record.project_name}`,
    `Symbol: ${record.token_symbol}`,
    `Mint: ${record.mint_address}`,
  ]

  if (record.contact_email) {
    lines.push(`Email: ${record.contact_email}`)
  }

  lines.push(`Submitted: ${formatSubmittedAt(record.created_at)}`)
  lines.push('')
  lines.push(`Review: ${ADMIN_SUBMISSIONS_URL}`)

  return lines.join('\n')
}

function getTelegramConfig(env) {
  const botToken = trimString(env?.TELEGRAM_BOT_TOKEN)
  const chatId = trimString(env?.TELEGRAM_ADMIN_CHAT_ID)

  if (!botToken || !chatId) {
    return null
  }

  return { botToken, chatId }
}

/**
 * Send admin Telegram alert for a new submission.
 * Never throws — submission success must not depend on Telegram.
 */
export async function notifyAdminOfNewSubmission(env, record) {
  const config = getTelegramConfig(env)

  if (!config) {
    console.log(
      `${LOG_PREFIX} skipped — TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured`,
    )
    return { ok: false, skipped: true }
  }

  const text = buildSubmissionNotificationText(record)
  const url = `${TELEGRAM_API_BASE}/bot${config.botToken}/sendMessage`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      let detail = `HTTP ${response.status}`

      try {
        const payload = await response.json()

        if (typeof payload?.description === 'string' && payload.description.trim()) {
          detail = payload.description.trim()
        }
      } catch {
        // Ignore non-JSON error bodies
      }

      console.error(`${LOG_PREFIX} send failed: ${detail}`)
      return { ok: false }
    }

    console.log(`${LOG_PREFIX} notification sent`)
    return { ok: true }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} send failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )
    return { ok: false }
  }
}
