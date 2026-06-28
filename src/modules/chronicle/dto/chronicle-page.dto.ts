import { IsOptional, IsString, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ChronicleCategory, ChronicleStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class ChroniclePageDto extends PaginationDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(ChronicleCategory)
  category?: ChronicleCategory;

  @IsOptional()
  @IsEnum(ChronicleStatus)
  status?: ChronicleStatus;

  @IsOptional()
  @IsUUID('4')
  taggedBodyId?: string;

  @IsOptional()
  @IsUUID('4')
  attributedToBodyId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pinnedOnly?: boolean;

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'mostLiked'])
  sortBy?: 'newest' | 'oldest' | 'mostLiked';
}
