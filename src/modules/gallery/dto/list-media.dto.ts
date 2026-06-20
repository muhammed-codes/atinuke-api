import { IsBooleanString, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MediaType } from '@prisma/client';

export class ListMediaDto {
  @IsOptional()
  @IsUUID()
  albumId?: string;

  @IsOptional()
  @IsUUID()
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
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
