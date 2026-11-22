import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Visibility } from '@prisma/client';

export class CreateFolderDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
