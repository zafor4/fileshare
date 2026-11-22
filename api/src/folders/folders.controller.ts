import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';
import { FoldersService } from './folders.service';

type AuthedRequest = Request & { user: { id: string } };

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.folders.list(req.user.id);
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.folders.get(req.user.id, id);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateFolderDto) {
    return this.folders.create(req.user.id, dto);
  }

  @Patch(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folders.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.folders.remove(req.user.id, id);
  }
}
