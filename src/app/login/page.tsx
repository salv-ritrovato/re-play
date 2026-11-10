import type { Metadata } from "next";
import { Suspense } from "react";
import { Wordmark, TAGLINE } from "@/components/layout/wordmark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid flex-1 place-items-center px-5 py-16">
      <div className="w-full max-w-sm space-y-10">
        <div className="space-y-3">
          <Wordmark size="lg" />
          <p className="eyebrow">{TAGLINE}</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Owner sign in</h1>
          <p className="text-sm text-muted-foreground">
            This area is private. Only the archive owner can manage the collection.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginFormWithNext searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginFormWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : "/admin"} />;
}
