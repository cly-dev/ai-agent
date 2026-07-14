import { WriteConfirmationPort } from '../../core/session-run/write-confirmation.port';
import { PendingWriteConfirmationStore } from './pending-write-confirmation.store';
export declare class ChatWriteConfirmationPort extends WriteConfirmationPort {
    private readonly pendingWriteConfirmationStore;
    constructor(pendingWriteConfirmationStore: PendingWriteConfirmationStore);
    clear(sessionId: string): Promise<void>;
}
