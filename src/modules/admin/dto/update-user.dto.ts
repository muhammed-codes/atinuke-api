import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User display name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsPhoneNumber()
  phoneNumber?: string;
}
