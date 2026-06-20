import { LogCategory, LogLevel, LogSource } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsInt } from 'class-validator';

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
  @IsEnum(LogSource)
  source?: LogSource;

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
