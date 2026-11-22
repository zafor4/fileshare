"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/vault";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [user, loading, router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell flex min-h-[70vh] flex-col justify-center py-10">
      <div className="mx-auto w-full max-w-md fade-up">
        <div className="mb-6">
          <span className="badge badge-private">Private vault</span>
          <h1 className="brand mt-3 text-4xl">Sign in</h1>
          <p className="mt-2 text-muted">
            Needed only for private content and vault management. Public items
            stay open without an account.
          </p>
        </div>

        <form onSubmit={onSubmit} className="panel space-y-4 p-6">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="field"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="field"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={busy} type="submit">
            {busy ? "Signing in…" : "Sign in to vault"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          No account?{" "}
          <Link className="font-bold text-accent" href="/register">
            Create one
          </Link>
          {" · "}
          <Link className="font-bold text-accent" href="/">
            Browse public library
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Suspense
        fallback={
          <main className="shell grid min-h-[50vh] place-items-center text-muted">
            Loading…
          </main>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
