import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarriageStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddSpouseDto {
  @ApiProperty()
  @IsUUID()
  spouseId: string;

  @ApiProperty({ enum: MarriageStatus })
  @IsEnum(MarriageStatus)
  status: MarriageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marriageDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
