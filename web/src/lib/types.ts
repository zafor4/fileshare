export type Visibility = "PRIVATE" | "PUBLIC";
export type ItemType = "FILE" | "LINK" | "CREDENTIAL";

export type User = {
  id: string;
  email: string;
  name: string | null;
};

export type Folder = {
  id: string;
  name: string;
  visibility: Visibility;
  shareToken: string | null;
  parentId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number; children: number };
};

export type Item = {
  id: string;
  type: ItemType;
  title: string;
  visibility: Visibility;
  shareToken: string | null;
  folderId: string | null;
  ownerId: string;
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  username?: string | null;
  notes?: string | null;
  secret?: string;
  hasSecret?: boolean;
  createdAt: string;
  updatedAt: string;
};
