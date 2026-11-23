"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FilePreview } from "@/components/FilePreview";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import type { Item } from "@/lib/types";

function SharedItemContent() {
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
    <main className="shell py-6 md:py-10">
      {error ? (
        <div className="panel p-6 md:p-8">
          <h1 className="page-title">Not available</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/" className="btn btn-ghost btn-sm">
              Home
            </Link>
            <Link href="/login?next=/vault" className="btn btn-primary btn-sm">
              Sign in
            </Link>
          </div>
        </div>
      ) : null}

      {!error && !item ? <p className="text-sm text-muted">Loading…</p> : null}

      {item ? (
        <article className="panel space-y-4 p-5 md:p-7">
          <div className="flex flex-wrap gap-2">
            <span className="chip chip-neutral">{item.type}</span>
            <span className="chip chip-public">Public</span>
          </div>
          <h1 className="page-title">{item.title}</h1>

          {item.type === "LINK" && item.url ? (
            <a
              className="break-all text-sm text-accent underline-offset-2 hover:underline"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              {item.url}
            </a>
          ) : null}

          {item.type === "FILE" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">{item.fileName}</p>
              <FilePreview
                src={api.share.viewUrl(params.token)}
                mimeType={item.mimeType}
                fileName={item.fileName}
              />
              <div className="flex flex-wrap gap-2">
                <a
                  className="btn btn-primary btn-sm"
                  href={api.share.viewUrl(params.token)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in new tab
                </a>
                <a
                  className="btn btn-ghost btn-sm"
                  href={api.share.downloadUrl(params.token)}
                >
                  Download
                </a>
              </div>
            </div>
          ) : null}

          {item.type === "CREDENTIAL" ? (
            <div className="rounded-lg border border-line bg-slate-50 p-4 text-sm">
              <p>
                <span className="font-semibold">Username:</span>{" "}
                {item.username || "—"}
              </p>
              <p className="mt-2">
                <span className="font-semibold">Secret:</span>{" "}
                <code className="break-all">{item.secret || "—"}</code>
              </p>
            </div>
          ) : null}

          {item.notes ? <p className="text-sm text-muted">{item.notes}</p> : null}

          <Link href="/" className="btn btn-ghost btn-sm">
            Back
          </Link>
        </article>
      ) : null}
    </main>
  );
}

export default function SharedItemPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Suspense
        fallback={
          <main className="shell py-10 text-sm text-muted">Loading…</main>
        }
      >
        <SharedItemContent />
      </Suspense>
    </div>
  );
}