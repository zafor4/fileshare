"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth";

function SiteHeaderNav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/", label: "Browse", match: (p: string) => p === "/" },
    {
      href: "/vault",
      label: "Vault",
      match: (p: string) => p.startsWith("/vault"),
    },
  ];

  return (
    <header className="site-header">
      <div className="shell flex items-center justify-between gap-3 py-3">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-ink no-underline"
          onClick={() => setOpen(false)}
        >
          FileShare
        </Link>

        <nav className="hidden items-center gap-5 sm:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${item.match(pathname) ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {loading ? (
            <span className="text-sm text-muted">…</span>
          ) : user ? (
            <>
              <span className="max-w-[140px] truncate text-sm text-muted">
                {user.name || user.email}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={logout}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm sm:hidden"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-white px-3 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium no-underline ${
                  item.match(pathname)
                    ? "bg-slate-100 text-ink"
                    : "text-muted"
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
            {loading ? null : user ? (
              <>
                <p className="truncate px-1 text-sm text-muted">
                  {user.email}
                </p>
                <button
                  className="btn btn-ghost w-full"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  type="button"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-ghost w-full"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary w-full"
                  onClick={() => setOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SiteHeader() {
  return (
    <Suspense
      fallback={
        <header className="site-header">
          <div className="shell py-3 text-lg font-bold">FileShare</div>
        </header>
      }
    >
      <SiteHeaderNav />
    </Suspense>
  );
}