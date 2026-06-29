import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class BulkReviewChronicleDto {
  @ApiProperty({ type: [String], description: 'Array of UUIDs to process' })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];

  @ApiPropertyOptional({ description: 'Required when declining' })
  @IsOptional()
  @IsString()
  declineReason?: string;
}
