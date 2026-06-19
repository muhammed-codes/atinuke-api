import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsNumber, IsUrl } from 'class-validator';
import { MediaType } from '@prisma/client';

export class CreateMediaDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  dateTaken?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isAdminOnly?: boolean;

  @IsOptional()
  @IsString()
  albumId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bodyIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  
  @IsOptional()
  @IsNumber()
  sizeBytes?: number;
  
  @IsOptional()
  @IsString()
  hash?: string;
}
