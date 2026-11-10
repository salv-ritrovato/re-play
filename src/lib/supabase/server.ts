import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * Session-aware client for Server Components, Server Actions and Route Handlers.
 * Reads the auth cookies, so it is a runtime API: never call it inside `'use cache'`.
 */
export async function createClient() {
  const cookieStore = await cookies();
  // Session-dependent work must never be prerendered (the auth client reads the clock).
  await connection();

  return createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}
