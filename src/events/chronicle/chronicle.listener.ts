import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ChronicleSubmittedEvent, ChronicleApprovedEvent } from './chronicle.events';

@Injectable()
export class ChronicleListener {
  private readonly logger = new Logger(ChronicleListener.name);

  @OnEvent('chronicle.submitted')
  handleChronicleSubmittedEvent(event: ChronicleSubmittedEvent) {
    this.logger.log(`Chronicle submitted: ${event.chronicleId} - Pending review`);
  }

  @OnEvent('chronicle.approved')
  handleChronicleApprovedEvent(event: ChronicleApprovedEvent) {
    this.logger.log(`Chronicle approved: ${event.chronicleId}`);
  }
}
