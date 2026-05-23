import { createClient } from '@supabase/supabase-js'

/** Project URL only — no /rest/v1 or trailing slash */
export function normalizeSupabaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '')
  url = url.replace(/\/rest\/v1\/?$/i, '')
  return url
}

const url = import.meta.env.VITE_SUPABASE_URL
  ? normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
  : ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const isSupabaseConfigured = Boolean(url && key)

export const supabaseUrlMisconfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  /\/rest\/v1/i.test(import.meta.env.VITE_SUPABASE_URL)

export const supabase = isSupabaseConfigured
  ? createClient(url, key)
  : null
