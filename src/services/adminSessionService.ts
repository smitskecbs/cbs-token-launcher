const ADMIN_SESSION_STORAGE_KEY = 'cbs-launcher:admin-session-token'

export function getAdminSessionToken(): string | null {
  try {
    const token = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY)?.trim()
    return token || null
  } catch {
    return null
  }
}

export function setAdminSessionToken(token: string): void {
  try {
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token.trim())
  } catch {
    // Ignore storage errors
  }
}

export function clearAdminSessionToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminSessionToken()

  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}
