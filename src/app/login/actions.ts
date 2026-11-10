"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";

export interface LoginState {
  error?: string;
  fieldErrors?: { username?: string; password?: string };
}

function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  // Only allow same-site admin paths (prevents open redirects).
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "username" | "password";
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  // The owner signs in with a username; Supabase Auth identifies accounts by email.
  const email = parsed.data.username.includes("@")
    ? parsed.data.username
    : `${parsed.data.username.toLowerCase()}@re.local`;
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) return { error: "Invalid username or password." };

  // Authenticated is not enough: the account must also be the owner.
  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user?.id ?? "")
    .maybeSingle();
  if (profile?.role !== "owner") {
    await supabase.auth.signOut();
    return { error: "This account is not allowed to access the archive." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
