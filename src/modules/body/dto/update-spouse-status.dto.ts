import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarriageStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSpouseStatusDto {
  @ApiProperty({ enum: MarriageStatus })
  @IsEnum(MarriageStatus)
  status: MarriageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
