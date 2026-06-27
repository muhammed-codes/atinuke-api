import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaritalStatus, Sex } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBodyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullname: string;

  @ApiProperty({ enum: Sex })
  @IsEnum(Sex)
  sex: Sex;

  @ApiPropertyOptional({ example: '1950-01-01' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsDateString()
  dateOfBirth?: string | null;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  placeOfBirth: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsPhoneNumber()
  phoneNumber?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fatherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  motherId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photos?: string[];

  @ApiProperty()
  @IsBoolean()
  @Type(() => Boolean)
  isAlive: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString()
  deathDate?: string | null;

  @ApiProperty({ enum: MaritalStatus })
  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
