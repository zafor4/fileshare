import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ItemType, Visibility } from '@prisma/client';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { CryptoService } from '../crypto/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCredentialDto,
  CreateLinkDto,
  UpdateItemDto,
} from './dto/item.dto';

@Injectable()
export class ItemsService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    config: ConfigService,
  ) {
    this.uploadDir = config.get<string>('UPLOAD_DIR', './uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  list(ownerId: string, folderId?: string | null, type?: ItemType) {
    return this.prisma.item.findMany({
      where: {
        ownerId,
        ...(folderId === undefined
          ? {}
          : folderId === 'root' || folderId === null
            ? { folderId: null }
            : { folderId }),
        ...(type ? { type } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      select: this.safeSelect(),
    });
  }

  async get(ownerId: string, id: string, revealSecret = false) {
    const item = await this.prisma.item.findFirst({ where: { id, ownerId } });
    if (!item) throw new NotFoundException('Item not found');
    return this.toSafe(item, revealSecret);
  }

  async createLink(ownerId: string, dto: CreateLinkDto) {
    if (dto.folderId) await this.assertFolder(ownerId, dto.folderId);
    const visibility = dto.visibility ?? Visibility.PRIVATE;
    return this.prisma.item.create({
      data: {
        type: ItemType.LINK,
        title: dto.title,
        url: dto.url,
        notes: dto.notes,
        folderId: dto.folderId,
        ownerId,
        visibility,
        shareToken:
          visibility === Visibility.PUBLIC ? this.token() : undefined,
      },
      select: this.safeSelect(),
    });
  }

  async createCredential(ownerId: string, dto: CreateCredentialDto) {
    if (dto.folderId) await this.assertFolder(ownerId, dto.folderId);
    const visibility = dto.visibility ?? Visibility.PRIVATE;
    return this.prisma.item.create({
      data: {
        type: ItemType.CREDENTIAL,
        title: dto.title,
        username: dto.username,
        secretEnc: this.crypto.encrypt(dto.secret),
        notes: dto.notes,
        folderId: dto.folderId,
        ownerId,
        visibility,
        shareToken:
          visibility === Visibility.PUBLIC ? this.token() : undefined,
      },
      select: this.safeSelect(),
    });
  }

  async createFile(
    ownerId: string,
    file: Express.Multer.File,
    meta: {
      title?: string;
      folderId?: string;
      visibility?: Visibility;
      notes?: string;
    },
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (meta.folderId) await this.assertFolder(ownerId, meta.folderId);

    const visibility = meta.visibility ?? Visibility.PRIVATE;
    return this.prisma.item.create({
      data: {
        type: ItemType.FILE,
        title: meta.title?.trim() || file.originalname,
        fileName: file.originalname,
        filePath: file.filename,
        mimeType: file.mimetype,
        fileSize: file.size,
        notes: meta.notes,
        folderId: meta.folderId,
        ownerId,
        visibility,
        shareToken:
          visibility === Visibility.PUBLIC ? this.token() : undefined,
      },
      select: this.safeSelect(),
    });
  }

  async update(ownerId: string, id: string, dto: UpdateItemDto) {
    const item = await this.prisma.item.findFirst({ where: { id, ownerId } });
    if (!item) throw new NotFoundException('Item not found');
    if (dto.folderId) await this.assertFolder(ownerId, dto.folderId);

    const data: Record<string, unknown> = {
      title: dto.title,
      folderId: dto.folderId,
      notes: dto.notes,
      url: dto.url,
      username: dto.username,
    };

    if (dto.secret) {
      if (item.type !== ItemType.CREDENTIAL) {
        throw new BadRequestException('Secret only for credentials');
      }
      data.secretEnc = this.crypto.encrypt(dto.secret);
    }

    if (dto.visibility === Visibility.PUBLIC) {
      data.visibility = Visibility.PUBLIC;
      if (!item.shareToken) data.shareToken = this.token();
    }
    if (dto.visibility === Visibility.PRIVATE) {
      data.visibility = Visibility.PRIVATE;
      data.shareToken = null;
    }

    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const updated = await this.prisma.item.update({ where: { id }, data });
    return this.toSafe(updated, false);
  }

  async remove(ownerId: string, id: string) {
    const item = await this.prisma.item.findFirst({ where: { id, ownerId } });
    if (!item) throw new NotFoundException('Item not found');

    if (item.type === ItemType.FILE && item.filePath) {
      const full = join(this.uploadDir, item.filePath);
      if (existsSync(full)) unlinkSync(full);
    }

    await this.prisma.item.delete({ where: { id } });
    return { ok: true };
  }

  async getFilePath(ownerId: string, id: string) {
    const item = await this.prisma.item.findFirst({ where: { id, ownerId } });
    if (!item || item.type !== ItemType.FILE || !item.filePath) {
      throw new NotFoundException('File not found');
    }
    return {
      path: resolve(this.uploadDir, item.filePath),
      fileName: item.fileName ?? 'download',
      mimeType: item.mimeType ?? 'application/octet-stream',
    };
  }

  private async assertFolder(ownerId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, ownerId },
    });
    if (!folder) throw new ForbiddenException('Folder not found');
  }

  private token() {
    return randomBytes(24).toString('hex');
  }

  private safeSelect() {
    return {
      id: true,
      type: true,
      title: true,
      visibility: true,
      shareToken: true,
      folderId: true,
      ownerId: true,
      url: true,
      fileName: true,
      mimeType: true,
      fileSize: true,
      username: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private toSafe(
    item: {
      id: string;
      type: ItemType;
      title: string;
      visibility: Visibility;
      shareToken: string | null;
      folderId: string | null;
      ownerId: string;
      url: string | null;
      fileName: string | null;
      mimeType: string | null;
      fileSize: number | null;
      username: string | null;
      notes: string | null;
      secretEnc: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    revealSecret: boolean,
  ) {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      visibility: item.visibility,
      shareToken: item.shareToken,
      folderId: item.folderId,
      ownerId: item.ownerId,
      url: item.url,
      fileName: item.fileName,
      mimeType: item.mimeType,
      fileSize: item.fileSize,
      username: item.username,
      notes: item.notes,
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
