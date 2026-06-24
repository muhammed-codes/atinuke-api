import { Module } from '@nestjs/common';
import { ChronicleController } from './chronicle.controller';
import { ChronicleService } from './chronicle.service';
import { ChronicleCommentController } from './chronicle-comment.controller';
import { ChronicleCommentService } from './chronicle-comment.service';

@Module({
  controllers: [ChronicleController, ChronicleCommentController],
  providers: [ChronicleService, ChronicleCommentService],
})
export class ChronicleModule {}
