import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TreeCacheListener } from './tree-cache/tree-cache.listener';
import { ChronicleListener } from './chronicle/chronicle.listener';
import { BodyModule } from '../modules/body/body.module';
import { ChronicleModule } from '../modules/chronicle/chronicle.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
    }),
    BodyModule,
    ChronicleModule,
  ],
  providers: [TreeCacheListener, ChronicleListener],
})
export class EventsModule {}
