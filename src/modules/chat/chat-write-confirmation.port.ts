import { Injectable } from '@nestjs/common';
import { WriteConfirmationPort } from '../../core/session-run/write-confirmation.port';
import { PendingWriteConfirmationStore } from './pending-write-confirmation.store';

@Injectable()
export class ChatWriteConfirmationPort extends WriteConfirmationPort {
  constructor(
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
  ) {
    super();
  }

  clear(sessionId: string): Promise<void> {
    return this.pendingWriteConfirmationStore.clear(sessionId);
  }
}
