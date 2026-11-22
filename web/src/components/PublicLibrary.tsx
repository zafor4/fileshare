"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type PublicFolder = {
  id: string;
  name: string;
  shareToken: string | null;
  updatedAt: string;
  itemCount: number;
  childCount: number;
};

type PublicItem = {
  id: string;
  type: "FILE" | "LINK" | "CREDENTIAL";
  title: string;
  shareToken: string | null;
  url?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  notes?: string | null;
  updatedAt: string;
  folderName?: string | null;
};

type Filter = "ALL" | "FILE" | "LINK" | "CREDENTIAL" | "FOLDER";

export function PublicLibrary() {
  const [folders, setFolders] = useState<PublicFolder[]>([]);
  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    api.share
      .publicList()
      .then((data) => {
        setFolders(data.folders);
        setItems(data.items);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filteredFolders = useMemo(() => {
    if (filter !== "ALL" && filter !== "FOLDER") return [];
    const q = query.trim().toLowerCase();
    return folders.filter((f) => !q || f.name.toLowerCase().includes(q));
  }, [folders, filter, query]);

  const filteredItems = useMemo(() => {
    if (filter === "FOLDER") return [];
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (filter !== "ALL" && i.type !== filter) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q) ||
        (i.fileName || "").toLowerCase().includes(q) ||
        (i.url || "").toLowerCase().includes(q) ||
        (i.folderName || "").toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  const empty =
    !loading && !error && filteredFolders.length === 0 && filteredItems.length === 0;

  return (
    <section className="fade-up space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="badge badge-public">Public</span>
            <span className="text-sm text-muted">No login required</span>
          </div>
          <h2 className="brand text-3xl md:text-4xl">Public library</h2>
          <p className="mt-2 max-w-xl text-muted">
            Anything marked public is listed here and open to anyone with the
            link. Private vault items never appear.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-[340px]">
          <label className="label" htmlFor="public-search">
            Search public content
          </label>
          <input
            id="public-search"
            className="field"
            placeholder="Search files, links, folders…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ALL", "All"],
            ["FOLDER", "Folders"],
            ["FILE", "Files"],
            ["LINK", "Links"],
            ["CREDENTIAL", "Credentials"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`btn ${filter === value ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-muted">Loading public content…</p> : null}
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-danger">
          {error}
        </p>
      ) : null}

      {empty ? (
        <div className="panel px-6 py-12 text-center">
          <p className="brand text-2xl">Nothing public yet</p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Sign in to your vault, create an item, and set access to Public.
            It will show up here for anyone.
          </p>
          <Link href="/login?next=/vault" className="btn btn-primary mt-5">
            Go to vault
          </Link>
        </div>
      ) : null}

      <div className="space-y-3">
        {filteredFolders.map((folder) => (
          <article key={folder.id} className="item-row">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="badge badge-type">Folder</span>
                <span className="badge badge-public">Public</span>
              </div>
              <h3 className="text-lg font-bold">{folder.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {folder.itemCount} items · {folder.childCount} subfolders
              </p>
            </div>
            {folder.shareToken ? (
              <Link
                className="btn btn-primary"
                href={`/share/folder/${folder.shareToken}`}
              >
                Open
              </Link>
            ) : null}
          </article>
        ))}

        {filteredItems.map((item) => (
          <article key={item.id} className="item-row">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="badge badge-type">{item.type}</span>
                <span className="badge badge-public">Public</span>
              </div>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">
                {item.folderName ? `${item.folderName} · ` : ""}
                {item.type === "FILE" && item.fileName
                  ? item.fileName
                  : item.type === "LINK" && item.url
                    ? item.url
                    : item.type === "CREDENTIAL"
                      ? "Shared credential"
                      : "Shared item"}
              </p>
            </div>
            {item.shareToken ? (
              <Link
                className="btn btn-primary"
                href={`/share/item/${item.shareToken}`}
              >
                {item.type === "FILE" ? "View" : "Open"}
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
