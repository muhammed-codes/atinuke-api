import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkBodyDto {
  @ApiProperty()
  @IsUUID()
  bodyId: string;
}
