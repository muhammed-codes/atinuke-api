import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarriageStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateBodyDto } from './create-body.dto';

export class NuclearFamilyParentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ type: () => CreateBodyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBodyDto)
  details?: CreateBodyDto;
}

export class NuclearFamilyMarriageDto {
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

export class CreateNuclearFamilyDto {
  @ApiPropertyOptional({ type: () => NuclearFamilyParentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NuclearFamilyParentDto)
  father?: NuclearFamilyParentDto;

  @ApiPropertyOptional({ type: () => NuclearFamilyParentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NuclearFamilyParentDto)
  mother?: NuclearFamilyParentDto;

  @ApiPropertyOptional({ type: () => NuclearFamilyMarriageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NuclearFamilyMarriageDto)
  marriageDetails?: NuclearFamilyMarriageDto;

  @ApiProperty({ type: [CreateBodyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBodyDto)
  children: CreateBodyDto[];
}
