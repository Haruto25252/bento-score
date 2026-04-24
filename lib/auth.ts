export async function hashPassphrase(passphrase: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(passphrase)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const STORAGE_KEY = 'bento_auth'

export function getStoredAuth(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setStoredAuth(passphrase: string): void {
  localStorage.setItem(STORAGE_KEY, passphrase)
}

export function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEY)
}
