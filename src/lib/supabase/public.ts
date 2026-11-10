import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Cookie-less, anonymous client for public reads.
 * Safe to use inside `'use cache'` scopes because it never touches request data.
 */
export function createPublicClient() {
  return createClient(supabaseUrl(), supabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
