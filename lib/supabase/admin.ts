import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Service-role client. BYPASSES RLS — server-only, used exclusively by the
 * notification dispatcher. Never import this from client code.
 */
export function createAdminClient() {
  if (!SUPABASE_URL || !serverEnv.serviceRoleKey) {
    throw new Error("Supabase admin client is not configured (SUPABASE_SERVICE_ROLE_KEY).");
  }
  return createClient(SUPABASE_URL, serverEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
