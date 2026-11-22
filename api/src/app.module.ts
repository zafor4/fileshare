import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CryptoModule } from './crypto/crypto.module';
import { FoldersModule } from './folders/folders.module';
import { ItemsModule } from './items/items.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShareModule } from './share/share.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CryptoModule,
    AuthModule,
    FoldersModule,
    ItemsModule,
    ShareModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
