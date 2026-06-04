import { PartialType } from '@nestjs/swagger';
import { CreateBodyDto } from './create-body.dto';

export class UpdateBodyDto extends PartialType(CreateBodyDto) {}
