import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ItemType, Visibility } from '@prisma/client';

export class CreateLinkDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsUrl({ require_protocol: true })
  url!: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCredentialDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  @MinLength(1)
  secret!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  folderId?: string | null;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl({ require_protocol: true })
  url?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateFileMetaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  notes?: string;
}

export { ItemType };
