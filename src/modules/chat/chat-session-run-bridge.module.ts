import { Module } from '@nestjs/common';
import { RunEventPublisher } from '../../core/session-run/run-event.publisher';
import { WriteConfirmationPort } from '../../core/session-run/write-confirmation.port';
import { ChatEventsModule } from './chat-events.module';
import { ChatRunEventPublisher } from './chat-run-event.publisher';
import { ChatWriteConfirmationPort } from './chat-write-confirmation.port';

/**
 * Session run 出站端口实现：解耦 SessionRunModule 与 ChatModule 环依赖。
 */
@Module({
  imports: [ChatEventsModule],
  providers: [
    ChatRunEventPublisher,
    ChatWriteConfirmationPort,
    {
      provide: RunEventPublisher,
      useExisting: ChatRunEventPublisher,
    },
    {
      provide: WriteConfirmationPort,
      useExisting: ChatWriteConfirmationPort,
    },
  ],
  exports: [RunEventPublisher, WriteConfirmationPort],
})
export class ChatSessionRunBridgeModule {}
