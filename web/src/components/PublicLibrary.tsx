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
    !loading &&
    !error &&
    filteredFolders.length === 0 &&
    filteredItems.length === 0;

  const filters: { value: Filter; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "FOLDER", label: "Folders" },
    { value: "FILE", label: "Files" },
    { value: "LINK", label: "Links" },
    { value: "CREDENTIAL", label: "Credentials" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <input
          className="field sm:max-w-xs"
          placeholder="Search…"
          aria-label="Search public content"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="filter-bar">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`btn btn-sm ${
              filter === value ? "btn-primary" : "btn-ghost"
            }`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : null}
      {error ? <p className="alert-error">{error}</p> : null}

      {empty ? (
        <div className="card px-4 py-10 text-center">
          <p className="font-medium text-ink">Nothing public yet</p>
          <p className="mt-1 text-sm text-muted">
            Sign in and set an item to public to list it here.
          </p>
          <Link href="/login?next=/vault" className="btn btn-primary btn-sm mt-4">
            Sign in
          </Link>
        </div>
      ) : null}

      <div className="space-y-2">
        {filteredFolders.map((folder) => (
          <article key={folder.id} className="list-row">
            <div className="min-w-0">
              <TypeLabel type="FOLDER" />
              <h3 className="mt-1 truncate font-semibold">{folder.name}</h3>
              <p className="mt-0.5 text-sm text-muted">
                {folder.itemCount} items
                {folder.childCount > 0
                  ? ` · ${folder.childCount} folders`
                  : ""}
              </p>
            </div>
            {folder.shareToken ? (
              <Link
                className="btn btn-primary btn-sm shrink-0"
                href={`/share/folder/${folder.shareToken}`}
              >
                Open
              </Link>
            ) : null}
          </article>
        ))}

        {filteredItems.map((item) => (
          <article key={item.id} className="list-row">
            <div className="min-w-0">
              <TypeLabel type={item.type} />
              <h3 className="mt-1 truncate font-semibold">{item.title}</h3>
              <p className="mt-0.5 truncate text-sm text-muted">
                {subtitleForItem(item)}
              </p>
            </div>
            {item.shareToken ? (
              <Link
                className="btn btn-primary btn-sm shrink-0"
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

function TypeLabel({ type }: { type: string }) {
  return <span className="chip chip-neutral">{type}</span>;
}

function subtitleForItem(item: PublicItem) {
  if (item.folderName) return item.folderName;
  if (item.type === "FILE" && item.fileName) return item.fileName;
  if (item.type === "LINK" && item.url) return item.url;
  return item.type === "CREDENTIAL" ? "Credential" : "";
}