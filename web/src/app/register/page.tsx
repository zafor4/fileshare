"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/vault");
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register(name, email, password);
      router.push("/vault");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="shell flex min-h-[70vh] flex-col justify-center py-10">
        <div className="mx-auto w-full max-w-md fade-up">
          <div className="mb-6">
            <span className="badge badge-private">Private vault</span>
            <h1 className="brand mt-3 text-4xl">Create vault</h1>
            <p className="mt-2 text-muted">
              Your private space for files, links, and credentials. Publish
              anything later if you want it open without login.
            </p>
          </div>

          <form onSubmit={onSubmit} className="panel space-y-4 p-6">
            <div>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="field"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted">At least 8 characters</p>
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button className="btn btn-primary w-full" disabled={busy} type="submit">
              {busy ? "Creating…" : "Create vault"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link className="font-bold text-accent" href="/login?next=/vault">
              Sign in
            </Link>
            {" · "}
            <Link className="font-bold text-accent" href="/">
              Browse public
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
