import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Visibility } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string) {
    return this.prisma.folder.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { items: true, children: true } } },
    });
  }

  async get(ownerId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, ownerId },
      include: {
        items: { orderBy: { updatedAt: 'desc' } },
        children: { orderBy: { name: 'asc' } },
      },
    });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  async create(ownerId: string, dto: CreateFolderDto) {
    if (dto.parentId) await this.assertOwned(ownerId, dto.parentId);

    const visibility = dto.visibility ?? Visibility.PRIVATE;
    return this.prisma.folder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId,
        ownerId,
        visibility,
        shareToken:
          visibility === Visibility.PUBLIC ? this.token() : undefined,
      },
    });
  }

  async update(ownerId: string, id: string, dto: UpdateFolderDto) {
    await this.assertOwned(ownerId, id);
    if (dto.parentId) await this.assertOwned(ownerId, dto.parentId);

    const data: Record<string, unknown> = { ...dto };
    if (dto.visibility === Visibility.PUBLIC) {
      const current = await this.prisma.folder.findUniqueOrThrow({
        where: { id },
      });
      if (!current.shareToken) data.shareToken = this.token();
    }
    if (dto.visibility === Visibility.PRIVATE) {
      data.shareToken = null;
    }

    return this.prisma.folder.update({ where: { id }, data });
  }

  async remove(ownerId: string, id: string) {
    await this.assertOwned(ownerId, id);
    await this.prisma.folder.delete({ where: { id } });
    return { ok: true };
  }

  private async assertOwned(ownerId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, ownerId },
    });
    if (!folder) throw new ForbiddenException('Folder not found');
    return folder;
  }

  private token() {
    return randomBytes(24).toString('hex');
  }
}
