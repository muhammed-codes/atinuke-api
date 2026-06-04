import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TreeCacheListener } from './tree-cache/tree-cache.listener';
import { BodyModule } from '../modules/body/body.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
    }),
    BodyModule,
  ],
  providers: [TreeCacheListener],
})
export class EventsModule {}
