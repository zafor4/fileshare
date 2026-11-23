"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import type { Item } from "@/lib/types";

type SharedFolder = {
  kind: "folder";
  id: string;
  name: string;
  children: { id: string; name: string; shareToken: string | null }[];
  items: Item[];
};

function SharedFolderContent() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<SharedFolder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.share
      .folder(params.token)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"));
  }, [params.token]);

  return (
    <main className="shell py-6 md:py-10">
      {error ? (
        <div className="panel p-6 md:p-8">
          <h1 className="page-title">Not available</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <Link href="/" className="btn btn-primary btn-sm mt-5">
            Home
          </Link>
        </div>
      ) : null}

      {!error && !data ? <p className="text-sm text-muted">Loading…</p> : null}

      {data ? (
        <div className="space-y-5">
          <header className="panel p-5 md:p-6">
            <span className="chip chip-public">Public folder</span>
            <h1 className="page-title mt-2">{data.name}</h1>
          </header>

          {data.children.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Subfolders
              </h2>
              {data.children.map((c) =>
                c.shareToken ? (
                  <Link
                    key={c.id}
                    className="list-row no-underline"
                    href={`/share/folder/${c.shareToken}`}
                  >
                    <div className="min-w-0">
                      <span className="chip chip-neutral">Folder</span>
                      <h3 className="mt-1 truncate font-semibold">{c.name}</h3>
                    </div>
                    <span className="btn btn-primary btn-sm shrink-0">Open</span>
                  </Link>
                ) : null,
              )}
            </section>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Items
            </h2>
            {data.items.length === 0 ? (
              <div className="card px-4 py-8 text-center text-sm text-muted">
                No public items in this folder.
              </div>
            ) : (
              data.items.map((item) =>
                item.shareToken ? (
                  <Link
                    key={item.id}
                    className="list-row no-underline"
                    href={`/share/item/${item.shareToken}`}
                  >
                    <div className="min-w-0">
                      <span className="chip chip-neutral">{item.type}</span>
                      <h3 className="mt-1 truncate font-semibold">{item.title}</h3>
                    </div>
                    <span className="btn btn-primary btn-sm shrink-0">Open</span>
                  </Link>
                ) : null,
              )
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default function SharedFolderPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Suspense
        fallback={
          <main className="shell py-10 text-sm text-muted">Loading…</main>
        }
      >
        <SharedFolderContent />
      </Suspense>
    </div>
  );
}