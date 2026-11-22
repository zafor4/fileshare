import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const uploadDir = config.get<string>('UPLOAD_DIR', './uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}
void bootstrap();
