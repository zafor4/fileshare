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

      <main className="shell py-8 md:py-12">
        <section className="panel fade-up mb-10 overflow-hidden p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="brand text-5xl leading-none md:text-6xl">FileShare</p>
              <p className="mt-4 max-w-xl text-lg text-muted">
                One place for files, links, and credentials. Mark something{" "}
                <strong className="text-ink">public</strong> and anyone can open
                it. Keep it <strong className="text-ink">private</strong> and
                only your signed-in vault can see it.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {!loading && user ? (
                  <Link href="/vault" className="btn btn-primary">
                    Open my vault
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="btn btn-primary">
                      Create vault
                    </Link>
                    <Link href="/login?next=/vault" className="btn btn-ghost">
                      Sign in
                    </Link>
                  </>
                )}
                <a href="#public-library" className="btn btn-ghost">
                  Browse public
                </a>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-line bg-white/80 p-4">
                <span className="badge badge-public">Public</span>
                <p className="mt-2 font-bold">Open without login</p>
                <p className="mt-1 text-sm text-muted">
                  Listed in the public library and reachable by share link.
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-white/80 p-4">
                <span className="badge badge-private">Private</span>
                <p className="mt-2 font-bold">Vault only</p>
                <p className="mt-1 text-sm text-muted">
                  Requires sign-in. Never shown on the public library.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div id="public-library">
          <PublicLibrary />
        </div>
      </main>
    </div>
  );
}
