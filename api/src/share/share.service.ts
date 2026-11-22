import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ItemType, Visibility } from '@prisma/client';
import { join } from 'path';
import { CryptoService } from '../crypto/crypto.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShareService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    config: ConfigService,
  ) {
    this.uploadDir = config.get<string>('UPLOAD_DIR', './uploads');
  }

  async listPublic() {
    const [folders, items] = await Promise.all([
      this.prisma.folder.findMany({
        where: { visibility: Visibility.PUBLIC, shareToken: { not: null } },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          shareToken: true,
          updatedAt: true,
          _count: { select: { items: true, children: true } },
        },
      }),
      this.prisma.item.findMany({
        where: { visibility: Visibility.PUBLIC, shareToken: { not: null } },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          shareToken: true,
          url: true,
          fileName: true,
          mimeType: true,
          fileSize: true,
          notes: true,
          updatedAt: true,
          folder: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      folders: folders.map((f) => ({
        id: f.id,
        name: f.name,
        shareToken: f.shareToken,
        updatedAt: f.updatedAt,
        itemCount: f._count.items,
        childCount: f._count.children,
      })),
      items: items.map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        shareToken: i.shareToken,
        url: i.url,
        fileName: i.fileName,
        mimeType: i.mimeType,
        fileSize: i.fileSize,
        notes: i.notes,
        updatedAt: i.updatedAt,
        folderName: i.folder?.name ?? null,
      })),
    };
  }

  async getFolder(token: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { shareToken: token, visibility: Visibility.PUBLIC },
      include: {
        items: {
          where: { visibility: Visibility.PUBLIC },
          orderBy: { updatedAt: 'desc' },
        },
        children: {
          where: { visibility: Visibility.PUBLIC },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!folder) throw new NotFoundException('Shared folder not found');

    return {
      kind: 'folder' as const,
      id: folder.id,
      name: folder.name,
      children: folder.children.map((c) => ({
        id: c.id,
        name: c.name,
        shareToken: c.shareToken,
      })),
      items: folder.items.map((i) => this.mapItem(i, false)),
    };
  }

  async getItem(token: string) {
    const item = await this.prisma.item.findFirst({
      where: { shareToken: token, visibility: Visibility.PUBLIC },
    });
    if (!item) throw new NotFoundException('Shared item not found');
    return {
      kind: 'item' as const,
      ...this.mapItem(item, item.type === ItemType.CREDENTIAL),
    };
  }

  async getFilePath(token: string) {
    const item = await this.prisma.item.findFirst({
      where: {
        shareToken: token,
        visibility: Visibility.PUBLIC,
        type: ItemType.FILE,
      },
    });
    if (!item?.filePath) throw new NotFoundException('Shared file not found');
    return {
      path: join(this.uploadDir, item.filePath),
      fileName: item.fileName ?? 'download',
      mimeType: item.mimeType ?? 'application/octet-stream',
    };
  }

  private mapItem(
    item: {
      id: string;
      type: ItemType;
      title: string;
      url: string | null;
      fileName: string | null;
      mimeType: string | null;
      fileSize: number | null;
      username: string | null;
      notes: string | null;
      secretEnc: string | null;
      shareToken: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    revealSecret: boolean,
  ) {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      url: item.url,
      fileName: item.fileName,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      username: item.username,
      notes: item.notes,
      shareToken: item.shareToken,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      secret:
        revealSecret && item.secretEnc
          ? this.crypto.decrypt(item.secretEnc)
          : undefined,
      hasSecret: Boolean(item.secretEnc),
    };
  }
}
