const MAX_LENGTH = {
  projectName: 120,
  tokenSymbol: 20,
  mintAddress: 64,
  website: 500,
  telegram: 200,
  x: 200,
  description: 2000,
  contactEmail: 254,
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidMintAddress(value) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidOptionalUrl(value) {
  if (!value) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function validateSubmitLaunchPayload(body) {
  const projectName = trimString(body?.projectName)
  const tokenSymbol = trimString(body?.tokenSymbol)
  const mintAddress = trimString(body?.mintAddress)
  const website = trimString(body?.website)
  const telegram = trimString(body?.telegram)
  const x = trimString(body?.x)
  const description = trimString(body?.description)
  const contactEmail = trimString(body?.contactEmail)

  if (!projectName) {
    return { ok: false, message: 'Project name is required.' }
  }

  if (!tokenSymbol) {
    return { ok: false, message: 'Token symbol is required.' }
  }

  if (!mintAddress) {
    return { ok: false, message: 'Mint address is required.' }
  }

  if (!isValidMintAddress(mintAddress)) {
    return { ok: false, message: 'Mint address format is invalid.' }
  }

  if (!description) {
    return { ok: false, message: 'Description is required.' }
  }

  if (projectName.length > MAX_LENGTH.projectName) {
    return { ok: false, message: 'Project name is too long.' }
  }

  if (tokenSymbol.length > MAX_LENGTH.tokenSymbol) {
    return { ok: false, message: 'Token symbol is too long.' }
  }

  if (description.length > MAX_LENGTH.description) {
    return { ok: false, message: 'Description is too long.' }
  }

  if (website && (!isValidOptionalUrl(website) || website.length > MAX_LENGTH.website)) {
    return { ok: false, message: 'Website URL is invalid.' }
  }

  if (telegram.length > MAX_LENGTH.telegram) {
    return { ok: false, message: 'Telegram value is too long.' }
  }

  if (x.length > MAX_LENGTH.x) {
    return { ok: false, message: 'X value is too long.' }
  }

  if (
    contactEmail &&
    (!isValidEmail(contactEmail) || contactEmail.length > MAX_LENGTH.contactEmail)
  ) {
    return { ok: false, message: 'Contact email is invalid.' }
  }

  return {
    ok: true,
    data: {
      project_name: projectName,
      token_symbol: tokenSymbol,
      mint_address: mintAddress,
      website: website || null,
      telegram: telegram || null,
      x: x || null,
      description,
      contact_email: contactEmail || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  }
}

export async function insertSubmitLaunchRecord(env, record) {
  const supabaseUrl = env.SUPABASE_URL?.trim()
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      status: 500,
      message: 'Submission service is not configured.',
    }
  }

  try {
    const upstream = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/launch_submissions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(record),
      },
    )

    if (!upstream.ok) {
      return {
        ok: false,
        status: 502,
        message: 'Could not save your submission. Please try again later.',
      }
    }

    return { ok: true, status: 201 }
  } catch {
    return {
      ok: false,
      status: 502,
      message: 'Could not save your submission. Please try again later.',
    }
  }
}
