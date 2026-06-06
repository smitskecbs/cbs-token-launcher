export const ADMIN_LOGIN_API_PATH = '/api/admin/login'

export type AdminLoginResult =
  | { ok: true; token: string; expiresInMs: number }
  | { ok: false; message: string }

function resolveAdminLoginUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${ADMIN_LOGIN_API_PATH}`
  }

  return ADMIN_LOGIN_API_PATH
}

export async function loginAdmin(password: string): Promise<AdminLoginResult> {
  try {
    const response = await fetch(resolveAdminLoginUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      let message = 'Could not sign in. Please try again.'

      try {
        const data = (await response.json()) as { error?: string }

        if (typeof data.error === 'string' && data.error.trim()) {
          message = data.error.trim()
        }
      } catch {
        // Use generic message when response body is not JSON
      }

      return { ok: false, message }
    }

    const data = (await response.json()) as {
      ok: true
      token: string
      expiresInMs: number
    }

    return {
      ok: true,
      token: data.token,
      expiresInMs: data.expiresInMs,
    }
  } catch {
    return {
      ok: false,
      message: 'Could not reach the admin login service. Please try again.',
    }
  }
}
