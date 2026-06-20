import { LogCategory, LogLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryActivityLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;

  @IsOptional()
  @IsEnum(LogCategory)
  category?: LogCategory;

  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
