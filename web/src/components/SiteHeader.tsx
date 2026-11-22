"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/lib/auth";

function SiteHeaderNav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="shell flex items-center justify-between gap-4 py-3.5">
        <div className="flex items-center gap-6">
          <Link href="/" className="brand text-2xl text-ink no-underline">
            FileShare
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            <Link
              href="/"
              className={`nav-link ${pathname === "/" ? "active" : ""}`}
            >
              Public library
            </Link>
            <Link
              href="/vault"
              className={`nav-link ${pathname.startsWith("/vault") || pathname.startsWith("/dashboard") ? "active" : ""}`}
            >
              My vault
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-sm text-muted">…</span>
          ) : user ? (
            <>
              <span className="hidden text-sm text-muted md:inline">
                {user.name || user.email}
              </span>
              <Link href="/vault" className="btn btn-primary">
                Open vault
              </Link>
              <button className="btn btn-ghost" onClick={logout} type="button">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-primary">
                Create vault
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteHeader() {
  return (
    <Suspense
      fallback={
        <header className="site-header">
          <div className="shell py-3.5">
            <span className="brand text-2xl text-ink">FileShare</span>
          </div>
        </header>
      }
    >
      <SiteHeaderNav />
    </Suspense>
  );
}