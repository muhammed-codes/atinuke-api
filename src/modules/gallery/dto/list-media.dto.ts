import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { MediaType } from '@prisma/client';

export class ListMediaDto {
  @IsOptional()
  @IsString()
  albumId?: string;

  @IsOptional()
  @IsString()
  bodyId?: string;

  @IsOptional()
  @IsBooleanString()
  isPinned?: string;

  @IsOptional()
  @IsBooleanString()
  untagged?: string;

  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @IsOptional()
  @IsBooleanString()
  isDeleted?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
