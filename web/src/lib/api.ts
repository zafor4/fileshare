import type { Folder, Item, ItemType, User, Visibility } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fs_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const t = token();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data.message || (Array.isArray(data.message) ? data.message[0] : message);
    } catch {
      /* ignore */
    }
    throw new Error(typeof message === "string" ? message : "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register(body: { email: string; password: string; name: string }) {
    return request<{ user: User; accessToken: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(body) },
      false,
    );
  },
  login(body: { email: string; password: string }) {
    return request<{ user: User; accessToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) },
      false,
    );
  },
  me() {
    return request<User>("/auth/me");
  },
  folders: {
    list: () => request<Folder[]>("/folders"),
    get: (id: string) =>
      request<Folder & { items: Item[]; children: Folder[] }>(`/folders/${id}`),
    create: (body: {
      name: string;
      parentId?: string;
      visibility?: Visibility;
    }) =>
      request<Folder>("/folders", { method: "POST", body: JSON.stringify(body) }),
    update: (
      id: string,
      body: Partial<{ name: string; parentId: string | null; visibility: Visibility }>,
    ) =>
      request<Folder>(`/folders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      request<{ ok: boolean }>(`/folders/${id}`, { method: "DELETE" }),
  },
  items: {
    list: (folderId?: string | null, type?: ItemType) => {
      const q = new URLSearchParams();
      if (folderId !== undefined) q.set("folderId", folderId ?? "root");
      if (type) q.set("type", type);
      const qs = q.toString();
      return request<Item[]>(`/items${qs ? `?${qs}` : ""}`);
    },
    get: (id: string, reveal = false) =>
      request<Item>(`/items/${id}${reveal ? "?reveal=1" : ""}`),
    createLink: (body: {
      title: string;
      url: string;
      folderId?: string;
      visibility?: Visibility;
      notes?: string;
    }) =>
      request<Item>("/items/links", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    createCredential: (body: {
      title: string;
      username?: string;
      secret: string;
      notes?: string;
      folderId?: string;
      visibility?: Visibility;
    }) =>
      request<Item>("/items/credentials", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    createFile: (form: FormData) =>
      request<Item>("/items/files", { method: "POST", body: form }),
    update: (
      id: string,
      body: Partial<{
        title: string;
        folderId: string | null;
        visibility: Visibility;
        url: string;
        username: string;
        secret: string;
        notes: string;
      }>,
    ) =>
      request<Item>(`/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      request<{ ok: boolean }>(`/items/${id}`, { method: "DELETE" }),
    viewUrl: (id: string) => `${API_URL}/items/${id}/view`,
    downloadUrl: (id: string) => `${API_URL}/items/${id}/download`,
    async fetchBlob(id: string, mode: "view" | "download" = "view") {
      const res = await fetch(`${API_URL}/items/${id}/${mode}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(mode === "view" ? "Preview failed" : "Download failed");
      return res.blob();
    },
  },
  share: {
    publicList: () =>
      request<{
        folders: {
          id: string;
          name: string;
          shareToken: string | null;
          updatedAt: string;
          itemCount: number;
          childCount: number;
        }[];
        items: {
          id: string;
          type: ItemType;
          title: string;
          shareToken: string | null;
          url?: string | null;
          fileName?: string | null;
          mimeType?: string | null;
          fileSize?: number | null;
          notes?: string | null;
          updatedAt: string;
          folderName?: string | null;
        }[];
      }>("/share/public", {}, false),
    folder: (token: string) =>
      request<{
        kind: "folder";
        id: string;
        name: string;
        children: { id: string; name: string; shareToken: string | null }[];
        items: Item[];
      }>(`/share/folders/${token}`, {}, false),
    item: (token: string) =>
      request<{ kind: "item" } & Item>(`/share/items/${token}`, {}, false),
    viewUrl: (token: string) => `${API_URL}/share/items/${token}/view`,
    downloadUrl: (token: string) => `${API_URL}/share/items/${token}/download`,
  },
};

export function authHeaders(): HeadersInit {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export { API_URL };
