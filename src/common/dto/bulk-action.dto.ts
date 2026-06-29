import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class BulkActionDto {
  @ApiProperty({ type: [String], description: 'Array of UUIDs to process' })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
