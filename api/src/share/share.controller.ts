import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ShareService } from './share.service';

@Controller('share')
export class ShareController {
  constructor(private readonly share: ShareService) {}

  @Get('public')
  listPublic() {
    return this.share.listPublic();
  }

  @Get('folders/:token')
  getFolder(@Param('token') token: string) {
    return this.share.getFolder(token);
  }

  @Get('items/:token')
  getItem(@Param('token') token: string) {
    return this.share.getItem(token);
  }

  @Get('items/:token/download')
  async download(@Param('token') token: string, @Res() res: Response) {
    const file = await this.share.getFilePath(token);
    return res.download(file.path, file.fileName);
  }
}
