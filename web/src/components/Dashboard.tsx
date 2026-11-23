"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FilePreview } from "@/components/FilePreview";
import { api } from "@/lib/api";
import type { Folder, Item, Visibility } from "@/lib/types";

type Modal =
  | null
  | { kind: "folder" }
  | { kind: "link" }
  | { kind: "credential" }
  | { kind: "file" }
  | { kind: "secret"; item: Item }
  | { kind: "preview"; item: Item; url: string };

export function Dashboard() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  const refresh = useCallback(async () => {
    const [f, i] = await Promise.all([
      api.folders.list(),
      api.items.list(currentFolderId),
    ]);
    setFolders(f);
    setItems(i);
  }, [currentFolderId]);

  useEffect(() => {
    refresh().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load"),
    );
  }, [refresh]);

  const roots = useMemo(
    () => folders.filter((f) => f.parentId === null),
    [folders],
  );
  const childrenOf = useCallback(
    (id: string) => folders.filter((f) => f.parentId === id),
    [folders],
  );
  const currentFolder = folders.find((f) => f.id === currentFolderId) ?? null;
  const breadcrumb = useMemo(() => {
    const path: Folder[] = [];
    let cur = currentFolder;
    while (cur) {
      path.unshift(cur);
      cur = folders.find((f) => f.id === cur?.parentId) ?? null;
    }
    return path;
  }, [currentFolder, folders]);

  async function copyShare(kind: "folder" | "item", token: string) {
    const url = `${window.location.origin}/share/${kind}/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied("Share link copied");
    setTimeout(() => setCopied(""), 2000);
  }

  async function toggleVisibility(
    target: "folder" | "item",
    id: string,
    visibility: Visibility,
  ) {
    const next = visibility === "PRIVATE" ? "PUBLIC" : "PRIVATE";
    if (target === "folder") await api.folders.update(id, { visibility: next });
    else await api.items.update(id, { visibility: next });
    await refresh();
  }

  async function removeFolder(id: string) {
    if (!confirm("Delete this folder and its nested folders?")) return;
    await api.folders.remove(id);
    if (currentFolderId === id) setCurrentFolderId(null);
    await refresh();
  }

  async function removeItem(id: string) {
    if (!confirm("Delete this item?")) return;
    await api.items.remove(id);
    await refresh();
  }

  async function downloadFile(id: string, name: string) {
    const blob = await api.items.fetchBlob(id, "download");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function previewFile(item: Item) {
    try {
      const blob = await api.items.fetchBlob(item.id, "view");
      const url = URL.createObjectURL(blob);
      setModal({ kind: "preview", item, url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
    }
  }

  function closeModal() {
    if (modal?.kind === "preview") URL.revokeObjectURL(modal.url);
    setModal(null);
  }

  return (
    <main className="shell flex flex-col gap-4 py-5 md:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-title">Vault</h1>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setModal({ kind: "folder" })}
            type="button"
          >
            New folder
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setModal({ kind: "file" })}
            type="button"
          >
            Upload
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setModal({ kind: "link" })}
            type="button"
          >
            Link
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModal({ kind: "credential" })}
            type="button"
          >
            Credential
          </button>
        </div>
      </div>

      {error ? <p className="alert-error">{error}</p> : null}
      {copied ? <p className="alert-success">{copied}</p> : null}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_1fr] lg:gap-5">
        <aside className="panel order-2 p-3 lg:order-1">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
              Folders
            </h2>
            <button
              className="btn btn-ghost px-3 py-1.5 text-sm"
              onClick={() => setModal({ kind: "folder" })}
              type="button"
            >
              + New
            </button>
          </div>
          <button
            className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left text-sm ${
              currentFolderId === null
                ? "bg-accent-soft font-bold text-accent"
                : "hover:bg-white"
            }`}
            onClick={() => setCurrentFolderId(null)}
            type="button"
          >
            Root
          </button>
          <FolderTree
            folders={roots}
            childrenOf={childrenOf}
            currentId={currentFolderId}
            onSelect={setCurrentFolderId}
          />
        </aside>

        <section className="panel order-1 p-4 md:p-5 lg:order-2">
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-1 text-sm text-muted">
              <button className="hover:text-ink" onClick={() => setCurrentFolderId(null)} type="button">
                Root
              </button>
              {breadcrumb.map((f) => (
                <span key={f.id} className="flex items-center gap-1">
                  <span>/</span>
                  <button className="hover:text-ink" onClick={() => setCurrentFolderId(f.id)} type="button">
                    {f.name}
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">
                {currentFolder?.name ?? "Root"}
              </h2>
              {currentFolder ? (
                <span
                  className={`chip ${
                    currentFolder.visibility === "PUBLIC"
                      ? "chip-public"
                      : "chip-private"
                  }`}
                >
                  {currentFolder.visibility === "PUBLIC" ? "Public" : "Private"}
                </span>
              ) : null}
            </div>
          </div>

          {currentFolder ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                className="btn btn-ghost text-sm"
                onClick={() =>
                  toggleVisibility("folder", currentFolder.id, currentFolder.visibility)
                }
                type="button"
              >
                {currentFolder.visibility === "PUBLIC"
                  ? "Make private"
                  : "Make public"}
              </button>
              {currentFolder.shareToken ? (
                <button
                  className="btn btn-ghost text-sm"
                  onClick={() => copyShare("folder", currentFolder.shareToken!)}
                  type="button"
                >
                  Copy public link
                </button>
              ) : null}
              <button
                className="btn btn-danger text-sm"
                onClick={() => removeFolder(currentFolder.id)}
                type="button"
              >
                Delete folder
              </button>
            </div>
          ) : null}

          {currentFolderId ? (
            <div className="mb-5 grid gap-2 sm:grid-cols-2">
              {childrenOf(currentFolderId).map((f) => (
                <button
                  key={f.id}
                  className="rounded-2xl border border-line bg-white px-4 py-3 text-left hover:border-accent"
                  onClick={() => setCurrentFolderId(f.id)}
                  type="button"
                >
                  <div className="font-bold">{f.name}</div>
                  <div className="mt-1">
                    <span
                      className={`chip ${
                        f.visibility === "PUBLIC" ? "chip-public" : "chip-private"
                      }`}
                    >
                      {f.visibility === "PUBLIC" ? "Public" : "Private"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-12 text-center text-muted">
                Nothing in this folder yet. Upload a file or add a link/credential.
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="item-row">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="chip chip-neutral">{item.type}</span>
                      <span
                        className={`chip ${
                          item.visibility === "PUBLIC"
                            ? "chip-public"
                            : "chip-private"
                        }`}
                      >
                        {item.visibility === "PUBLIC" ? "Public" : "Private"}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    {item.type === "LINK" && item.url ? (
                      <a
                        className="mt-1 block break-all text-sm text-accent hover:underline"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.url}
                      </a>
                    ) : null}
                    {item.type === "FILE" ? (
                      <p className="mt-1 text-sm text-muted">
                        {item.fileName}
                        {item.fileSize
                          ? ` · ${(item.fileSize / 1024).toFixed(1)} KB`
                          : ""}
                      </p>
                    ) : null}
                    {item.type === "CREDENTIAL" ? (
                      <p className="mt-1 text-sm text-muted">
                        {item.username || "No username"} · encrypted secret
                      </p>
                    ) : null}
                    {item.notes ? (
                      <p className="mt-2 text-sm text-muted">{item.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.type === "FILE" ? (
                      <>
                        <button
                          className="btn btn-primary text-sm"
                          onClick={() => previewFile(item)}
                          type="button"
                        >
                          View
                        </button>
                        <button
                          className="btn btn-ghost text-sm"
                          onClick={() =>
                            downloadFile(item.id, item.fileName || item.title)
                          }
                          type="button"
                        >
                          Download
                        </button>
                      </>
                    ) : null}
                    {item.type === "CREDENTIAL" ? (
                      <button
                        className="btn btn-ghost text-sm"
                        onClick={() => setModal({ kind: "secret", item })}
                        type="button"
                      >
                        Reveal
                      </button>
                    ) : null}
                    <button
                      className="btn btn-ghost text-sm"
                      onClick={() =>
                        toggleVisibility("item", item.id, item.visibility)
                      }
                      type="button"
                    >
                      {item.visibility === "PUBLIC" ? "Make private" : "Make public"}
                    </button>
                    {item.shareToken ? (
                      <button
                        className="btn btn-ghost text-sm"
                        onClick={() => copyShare("item", item.shareToken!)}
                        type="button"
                      >
                        Copy link
                      </button>
                    ) : null}
                    <button
                      className="btn btn-danger text-sm"
                      onClick={() => removeItem(item.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {modal ? (
        <ModalShell
          onClose={closeModal}
          wide={modal.kind === "preview"}
        >
          {modal.kind === "folder" ? (
            <FolderForm
              busy={busy}
              onCancel={closeModal}
              onSubmit={async (name, visibility) => {
                setBusy(true);
                try {
                  await api.folders.create({
                    name,
                    parentId: currentFolderId ?? undefined,
                    visibility,
                  });
                  closeModal();
                  await refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : null}
          {modal.kind === "link" ? (
            <LinkForm
              busy={busy}
              onCancel={closeModal}
              onSubmit={async (data) => {
                setBusy(true);
                try {
                  await api.items.createLink({
                    ...data,
                    folderId: currentFolderId ?? undefined,
                  });
                  closeModal();
                  await refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : null}
          {modal.kind === "credential" ? (
            <CredentialForm
              busy={busy}
              onCancel={closeModal}
              onSubmit={async (data) => {
                setBusy(true);
                try {
                  await api.items.createCredential({
                    ...data,
                    folderId: currentFolderId ?? undefined,
                  });
                  closeModal();
                  await refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : null}
          {modal.kind === "file" ? (
            <FileForm
              busy={busy}
              onCancel={closeModal}
              onSubmit={async (form) => {
                setBusy(true);
                try {
                  if (currentFolderId) form.set("folderId", currentFolderId);
                  await api.items.createFile(form);
                  closeModal();
                  await refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : null}
          {modal.kind === "secret" ? (
            <RevealSecret itemId={modal.item.id} onClose={closeModal} />
          ) : null}
          {modal.kind === "preview" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{modal.item.title}</h3>
                  <p className="text-sm text-muted">{modal.item.fileName}</p>
                </div>
                <button
                  className="btn btn-ghost text-sm"
                  type="button"
                  onClick={() =>
                    downloadFile(
                      modal.item.id,
                      modal.item.fileName || modal.item.title,
                    )
                  }
                >
                  Download
                </button>
              </div>
              <FilePreview
                src={modal.url}
                mimeType={modal.item.mimeType}
                fileName={modal.item.fileName}
              />
            </div>
          ) : null}
        </ModalShell>
      ) : null}
    </main>
  );
}

function FolderTree({
  folders,
  childrenOf,
  currentId,
  onSelect,
  depth = 0,
}: {
  folders: Folder[];
  childrenOf: (id: string) => Folder[];
  currentId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  return (
    <ul className="space-y-1">
      {folders.map((f) => (
        <li key={f.id}>
          <button
            className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
              currentId === f.id
                ? "bg-accent-soft font-bold text-accent"
                : "hover:bg-white"
            }`}
            style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
            onClick={() => onSelect(f.id)}
            type="button"
          >
            {f.name}
          </button>
          <FolderTree
            folders={childrenOf(f.id)}
            childrenOf={childrenOf}
            currentId={currentId}
            onSelect={onSelect}
            depth={depth + 1}
          />
        </li>
      ))}
    </ul>
  );
}

function ModalShell({
  children,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#14201c]/45 p-4">
      <div className={`panel w-full p-5 ${wide ? "max-w-4xl" : "max-w-md"}`}>
        <div className="mb-3 flex justify-end">
          <button className="btn btn-ghost px-3 py-1.5" onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FolderForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (name: string, visibility: Visibility) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");

  async function submit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(name, visibility);
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <h3 className="text-lg font-semibold">New folder</h3>
      <div>
        <label className="label">Name</label>
        <input className="field" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <VisibilitySelect value={visibility} onChange={setVisibility} />
      <FormActions busy={busy} onCancel={onCancel} label="Create" />
    </form>
  );
}

function LinkForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (data: {
    title: string;
    url: string;
    notes?: string;
    visibility: Visibility;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");

  async function submit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({ title, url, notes: notes || undefined, visibility });
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <h3 className="text-lg font-semibold">Add link</h3>
      <div>
        <label className="label">Title</label>
        <input className="field" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label">URL</label>
        <input
          className="field"
          type="url"
          required
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <VisibilitySelect value={visibility} onChange={setVisibility} />
      <FormActions busy={busy} onCancel={onCancel} label="Save" />
    </form>
  );
}

function CredentialForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (data: {
    title: string;
    username?: string;
    secret: string;
    notes?: string;
    visibility: Visibility;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [secret, setSecret] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");

  async function submit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      title,
      username: username || undefined,
      secret,
      notes: notes || undefined,
      visibility,
    });
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <h3 className="text-lg font-semibold">Add credential</h3>
      <div>
        <label className="label">Title</label>
        <input className="field" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label">Username</label>
        <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label className="label">Password / secret</label>
        <input
          className="field"
          type="password"
          required
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <VisibilitySelect value={visibility} onChange={setVisibility} />
      <p className="text-xs text-muted">
        Secrets are encrypted with AES-256-GCM. Prefer private unless you truly want this public.
      </p>
      <FormActions busy={busy} onCancel={onCancel} label="Save" />
    </form>
  );
}

function FileForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (form: FormData) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
  const [file, setFile] = useState<File | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    if (notes) form.append("notes", notes);
    form.append("visibility", visibility);
    await onSubmit(form);
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <h3 className="text-lg font-semibold">Upload file</h3>
      <div>
        <label className="label">File</label>
        <input
          className="field"
          type="file"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div>
        <label className="label">Title (optional)</label>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <VisibilitySelect value={visibility} onChange={setVisibility} />
      <FormActions busy={busy || !file} onCancel={onCancel} label="Upload" />
    </form>
  );
}

function RevealSecret({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.items
      .get(itemId, true)
      .then((item) => setSecret(item.secret || ""))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [itemId]);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Credential secret</h3>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {secret === null ? (
        <p className="text-sm text-muted">Decrypting…</p>
      ) : (
        <code className="block break-all rounded-xl bg-stone-100 p-3 text-sm">
          {secret}
        </code>
      )}
      <button className="btn btn-ghost" onClick={onClose} type="button">
        Close
      </button>
    </div>
  );
}

function VisibilitySelect({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  return (
    <div>
      <label className="label">Access</label>
      <select
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value as Visibility)}
      >
        <option value="PRIVATE">Private — vault login required</option>
        <option value="PUBLIC">Public — listed & open without login</option>
      </select>
    </div>
  );
}

function FormActions({
  busy,
  onCancel,
  label,
}: {
  busy: boolean;
  onCancel: () => void;
  label: string;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button className="btn btn-primary" disabled={busy} type="submit">
        {label}
      </button>
      <button className="btn btn-ghost" onClick={onCancel} type="button">
        Cancel
      </button>
    </div>
  );
}
