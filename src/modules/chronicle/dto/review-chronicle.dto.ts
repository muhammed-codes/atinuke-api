import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewChronicleDto {
  @ApiPropertyOptional({ description: 'Required when declining' })
  @IsOptional()
  @IsString()
  declineReason?: string;
}
