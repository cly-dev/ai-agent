import type { AgentChatPageContext } from '../../host-bridge/page-context.types';
import type { PendingWriteConfirmationSnapshot } from '../../../modules/chat/pending-write-confirmation.types';
export type WriteConfirmActionKind = 'confirm_write' | 'cancel_write';
export type WriteConfirmActionMessagePersistence = {
    content: string;
    toolName: string;
    toolInput: Record<string, unknown>;
    pageContext: AgentChatPageContext | null;
};
export declare function buildWriteConfirmActionMessagePersistence(input: {
    action: WriteConfirmActionKind;
    pending: PendingWriteConfirmationSnapshot | null;
    incomingPageContext?: AgentChatPageContext | null;
}): WriteConfirmActionMessagePersistence;
