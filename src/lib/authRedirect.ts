/** Where Supabase should send users after password reset (must be allowlisted in Supabase). */
export function getAuthRedirectUrl(path = '/reset-password'): string {
  return `${window.location.origin}${path}`
}

/** True when the URL contains a Supabase password-recovery token. */
export function isRecoveryHash(): boolean {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return false
  return new URLSearchParams(hash).get('type') === 'recovery'
}

export function clearAuthHashFromUrl(): void {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}
