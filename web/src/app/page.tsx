"use client";

import Link from "next/link";
import { PublicLibrary } from "@/components/PublicLibrary";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="shell py-6 md:py-8">
        <header className="mb-6">
          <h1 className="page-title">Public library</h1>
          <p className="mt-1.5 text-sm text-muted">
            {loading
              ? "Loading…"
              : user
                ? "Browse shared items or manage your vault."
                : "Shared items anyone can open. Sign in to manage private content."}
          </p>
          {!loading && user ? (
            <Link href="/vault" className="btn btn-primary btn-sm mt-3">
              Open vault
            </Link>
          ) : null}
        </header>

        <PublicLibrary />
      </main>
    </div>
  );
}