import type { MessageBlock } from './message/message-blocks.types';
export declare function parseConfirmedPreviewBlocks(serialized: string | null | undefined): MessageBlock[];
export declare function stripWriteConfirmationPromptBlocks(blocks: MessageBlock[], gateMessage: string): MessageBlock[];
export declare function extractWriteConfirmExecutionStatusBlocks(blocks: MessageBlock[]): MessageBlock[];
export declare function mergeConfirmedPreviewWithExecutionStatus(input: {
    confirmedPreview: MessageBlock[];
    executionStatusBlocks: MessageBlock[];
    observationStructuredBlocks?: MessageBlock[];
}): MessageBlock[];
