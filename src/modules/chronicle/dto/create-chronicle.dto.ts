import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ChronicleCategory, ChronicleAttributionType } from '@prisma/client';

export class ChronicleMediaInput {
  @ApiProperty({ enum: ['IMAGE', 'AUDIO'] })
  @IsEnum(['IMAGE', 'AUDIO'])
  type: 'IMAGE' | 'AUDIO';

  @ApiProperty()
  @IsUrl()
  url: string;
}

export class CreateChronicleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'HTML content from the WYSIWYG editor' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: ChronicleCategory })
  @IsEnum(ChronicleCategory)
  category: ChronicleCategory;

  @ApiPropertyOptional({ type: [ChronicleMediaInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChronicleMediaInput)
  media?: ChronicleMediaInput[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  youtubeLinks?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Body IDs this story is about' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  taggedBodyIds?: string[];

  @ApiProperty({ enum: ChronicleAttributionType })
  @IsEnum(ChronicleAttributionType)
  attributedToType: ChronicleAttributionType;

  @ApiPropertyOptional({ description: 'Required if attributedToType = MEMBER' })
  @IsOptional()
  @IsUUID('4')
  attributedToBodyId?: string;

  @ApiPropertyOptional({ description: 'Required if attributedToType = CUSTOM' })
  @IsOptional()
  @IsString()
  attributedToLabel?: string;
}
