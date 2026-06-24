import { PartialType } from '@nestjs/swagger';
import { CreateChronicleDto } from './create-chronicle.dto';

export class UpdateChronicleDto extends PartialType(CreateChronicleDto) {}
