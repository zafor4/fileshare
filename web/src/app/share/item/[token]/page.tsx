"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import type { Item } from "@/lib/types";

export default function SharedItemPage() {
  const params = useParams<{ token: string }>();
  const [item, setItem] = useState<(Item & { kind: "item" }) | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.share
      .item(params.token)
      .then(setItem)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"));
  }, [params.token]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="shell fade-up py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="badge badge-public">Public item</span>
          <span className="text-sm text-muted">No login required</span>
        </div>

        {error ? (
          <div className="panel p-8">
            <h1 className="brand text-3xl">Not available</h1>
            <p className="mt-2 text-muted">{error}</p>
            <p className="mt-2 text-sm text-muted">
              This item is private or the link is invalid. Sign in to open your
              vault.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/" className="btn btn-ghost">
                Public library
              </Link>
              <Link href="/login?next=/vault" className="btn btn-primary">
                Sign in
              </Link>
            </div>
          </div>
        ) : null}

        {!error && !item ? <p className="text-muted">Loading shared item…</p> : null}

        {item ? (
          <article className="panel space-y-4 p-6 md:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-type">{item.type}</span>
              <span className="badge badge-public">Public</span>
            </div>
            <h1 className="brand text-4xl">{item.title}</h1>

            {item.type === "LINK" && item.url ? (
              <a
                className="break-all text-lg text-accent hover:underline"
                href={item.url}
                target="_blank"
                rel="noreferrer"
              >
                {item.url}
              </a>
            ) : null}

            {item.type === "FILE" ? (
              <div className="space-y-3">
                <p className="text-muted">{item.fileName}</p>
                <a
                  className="btn btn-primary inline-flex"
                  href={api.share.downloadUrl(params.token)}
                >
                  Download file
                </a>
              </div>
            ) : null}

            {item.type === "CREDENTIAL" ? (
              <div className="space-y-2 rounded-2xl bg-stone-100 p-4 text-sm">
                <p>
                  <span className="font-bold">Username:</span>{" "}
                  {item.username || "—"}
                </p>
                <p>
                  <span className="font-bold">Secret:</span>{" "}
                  <code className="break-all">{item.secret || "—"}</code>
                </p>
              </div>
            ) : null}

            {item.notes ? <p className="text-stone-600">{item.notes}</p> : null}

            <Link href="/" className="btn btn-ghost inline-flex">
              Back to public library
            </Link>
          </article>
        ) : null}
      </main>
    </div>
  );
}
