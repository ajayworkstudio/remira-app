/**
 * Public (browser-safe) configuration. Only NEXT_PUBLIC_* values here.
 * Server-only secrets live in lib/env.server.ts.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/** When Supabase isn't configured the app runs in a clearly-labelled on-device demo mode. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
