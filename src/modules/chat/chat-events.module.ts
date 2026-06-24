import { Module } from '@nestjs/common';
import { ChatEventsService } from './chat-events.service';
import { PendingWriteConfirmationStore } from './pending-write-confirmation.store';

/** SSE 事件总线 + 写确认存储（无 SessionRun 依赖，供 Bridge / Chat 共用）。 */
@Module({
  providers: [ChatEventsService, PendingWriteConfirmationStore],
  exports: [ChatEventsService, PendingWriteConfirmationStore],
})
export class ChatEventsModule {}
