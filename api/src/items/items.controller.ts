import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ItemType, Visibility } from '@prisma/client';
import type { Request, Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateCredentialDto,
  CreateLinkDto,
  UpdateItemDto,
} from './dto/item.dto';
import { ItemsService } from './items.service';

type AuthedRequest = Request & { user: { id: string } };

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list(
    @Req() req: AuthedRequest,
    @Query('folderId') folderId?: string,
    @Query('type') type?: ItemType,
  ) {
    return this.items.list(req.user.id, folderId, type);
  }

  @Get(':id')
  get(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Query('reveal') reveal?: string,
  ) {
    return this.items.get(req.user.id, id, reveal === '1' || reveal === 'true');
  }

  @Get(':id/view')
  async view(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.items.getFilePath(req.user.id, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    return res.sendFile(file.path);
  }

  @Get(':id/download')
  async download(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.items.getFilePath(req.user.id, id);
    return res.download(file.path, file.fileName);
  }

  @Post('links')
  createLink(@Req() req: AuthedRequest, @Body() dto: CreateLinkDto) {
    return this.items.createLink(req.user.id, dto);
  }

  @Post('credentials')
  createCredential(
    @Req() req: AuthedRequest,
    @Body() dto: CreateCredentialDto,
  ) {
    return this.items.createCredential(req.user.id, dto);
  }

  @Post('files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, process.env.UPLOAD_DIR || './uploads');
        },
        filename: (_req, file, cb) => {
          const id = randomBytes(16).toString('hex');
          cb(null, `${id}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  createFile(
    @Req() req: AuthedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
    @Body('folderId') folderId?: string,
    @Body('visibility') visibility?: Visibility,
    @Body('notes') notes?: string,
  ) {
    return this.items.createFile(req.user.id, file, {
      title,
      folderId,
      visibility,
      notes,
    });
  }

  @Patch(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.items.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.items.remove(req.user.id, id);
  }
}
