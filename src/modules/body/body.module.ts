import { Module } from '@nestjs/common';
import { BodyController } from './body.controller';
import { BodyService } from './body.service';
import { BodyTreeService } from './body-tree.service';

@Module({
  controllers: [BodyController],
  providers: [BodyService, BodyTreeService],
  exports: [BodyTreeService],
})
export class BodyModule {}
