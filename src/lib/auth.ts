import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Verified owner session. Checks the JWT with the Auth server AND the `owner` role
 * in `profiles`; RLS enforces the same rule again at the database level.
 */
const getOwner = cache(async () => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "owner") return null;
  return { id: auth.user.id, email: auth.user.email ?? "" };
});

/** For pages and layouts: redirects to /login when there is no owner session. */
export async function requireOwner() {
  const owner = await getOwner();
  if (!owner) redirect("/login");
  return owner;
}

/** For server actions: throws instead of redirecting. */
export async function assertOwner() {
  const owner = await getOwner();
  if (!owner) throw new Error("Unauthorized");
  return owner;
}
