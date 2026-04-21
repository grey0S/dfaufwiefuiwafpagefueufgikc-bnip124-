import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Safely resolve Supabase credentials.
//
// During Next.js static prerendering (SSG / ISR) the NEXT_PUBLIC_* env vars
// may be absent or empty.  The Supabase SDK throws immediately if the URL is
// not a valid HTTP(S) link, which kills the build.  We therefore:
//   1. Validate the URL with a try/catch around `new URL()`.
//   2. Fall back to a structurally-valid placeholder URL + key so the SDK can
//      be constructed without error.
//   3. Expose `isSupabaseConfigured` so runtime code can guard calls.
//
// NOTE: Supabase now uses `sb_publishable_*` keys in addition to legacy JWTs.
// ---------------------------------------------------------------------------

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder'

function resolveUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!raw) return PLACEHOLDER_URL
  try {
    const parsed = new URL(raw)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return raw
    }
  } catch {
    // malformed URL – fall through
  }
  return PLACEHOLDER_URL
}

function resolveKey(): string {
  // Support both the new publishable key format (sb_publishable_*) and legacy JWTs (eyJ*)
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (raw && (raw.startsWith('eyJ') || raw.startsWith('sb_'))) return raw
  return PLACEHOLDER_KEY
}

const supabaseUrl = resolveUrl()
const supabaseAnonKey = resolveKey()

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

/** True when real, validated Supabase credentials are configured */
export const isSupabaseConfigured: boolean =
  supabaseUrl !== PLACEHOLDER_URL && supabaseAnonKey !== PLACEHOLDER_KEY
