import { LogCategory, LogLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActivityLogDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userDisplay?: string;

  @IsString()
  action: string;

  @IsEnum(LogCategory)
  category: LogCategory;

  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsInt()
  statusCode?: number;

  @IsOptional()
  @IsInt()
  durationMs?: number;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
