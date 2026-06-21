import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsNumber, IsUrl, IsUUID, IsDateString, MaxLength } from 'class-validator';
import { MediaType } from '@prisma/client';

export class CreateMediaDto {
  @IsArray()
  @IsUrl({}, { each: true })
  urls: string[];

  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  caption?: string;

  @IsOptional()
  @IsDateString()
  dateTaken?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isAdminOnly?: boolean;

  @IsOptional()
  @IsUUID()
  albumId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  bodyIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];
  
  @IsOptional()
  @IsNumber()
  sizeBytes?: number;
  
  @IsOptional()
  @IsString()
  @MaxLength(64)
  hash?: string;
}
