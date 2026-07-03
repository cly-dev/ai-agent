import type { AgentChatPageContext } from '../../host-bridge/page-context.types';
import type { DraftReviewDecision } from '../../draft-review';
import type { PendingWriteConfirmationSnapshot } from '../../../modules/chat/pending-write-confirmation.types';
export type WriteConfirmActionKind = 'confirm_write' | 'cancel_write' | 'retry_write' | 'confirm_write_with_edits';
export type WriteConfirmActionMessagePersistence = {
    content: string;
    toolName: string;
    toolInput: Record<string, unknown>;
    pageContext: AgentChatPageContext | null;
};
export declare function buildWriteConfirmActionMessagePersistence(input: {
    decision: DraftReviewDecision;
    pending: PendingWriteConfirmationSnapshot | null;
    incomingPageContext?: AgentChatPageContext | null;
}): WriteConfirmActionMessagePersistence;
