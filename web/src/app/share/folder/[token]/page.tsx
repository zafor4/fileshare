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
    <main className="shell fade-up py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="badge badge-public">Public folder</span>
        <span className="text-sm text-muted">No login required</span>
      </div>

      {error ? (
        <div className="panel p-8">
          <h1 className="brand text-3xl">Not available</h1>
          <p className="mt-2 text-muted">{error}</p>
          <p className="mt-2 text-sm text-muted">
            This folder is private or the link is invalid.
          </p>
          <Link href="/" className="btn btn-primary mt-5">
            Back to public library
          </Link>
        </div>
      ) : null}

      {!error && !data ? <p className="text-muted">Loading shared folder…</p> : null}

      {data ? (
        <div className="space-y-6">
          <div className="panel p-6 md:p-8">
            <h1 className="brand text-4xl">{data.name}</h1>
            <p className="mt-2 text-muted">
              Public contents of this folder. Private items are hidden.
            </p>
          </div>

          {data.children.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
                Subfolders
              </h2>
              {data.children.map((c) =>
                c.shareToken ? (
                  <Link
                    key={c.id}
                    className="item-row no-underline"
                    href={`/share/folder/${c.shareToken}`}
                  >
                    <div>
                      <span className="badge badge-type">Folder</span>
                      <h3 className="mt-2 text-lg font-bold">{c.name}</h3>
                    </div>
                    <span className="btn btn-primary">Open</span>
                  </Link>
                ) : null,
              )}
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
              Items
            </h2>
            {data.items.length === 0 ? (
              <div className="panel px-6 py-10 text-center text-muted">
                No public items in this folder.
              </div>
            ) : (
              data.items.map((item) =>
                item.shareToken ? (
                  <Link
                    key={item.id}
                    className="item-row no-underline"
                    href={`/share/item/${item.shareToken}`}
                  >
                    <div>
                      <span className="badge badge-type">{item.type}</span>
                      <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
                    </div>
                    <span className="btn btn-primary">Open</span>
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
          <main className="shell py-12 text-muted">Loading shared folder…</main>
        }
      >
        <SharedFolderContent />
      </Suspense>
    </div>
  );
}