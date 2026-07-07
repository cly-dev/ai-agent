import type { MessageBlock } from './message-blocks.types';
export declare function isMessageBlocksDebugEnabled(): boolean;
export type AgentMessageSseDebugRecord = {
    writtenAt: string;
    tag: string;
    sessionId: string;
    runId?: number;
    turnId?: number;
    sseEvent: {
        event: 'message';
        payload: Record<string, unknown>;
    };
    source: Record<string, unknown>;
};
export type AgentMessagePersistDebugRecord = {
    writtenAt: string;
    tag: string;
    sessionId: string;
    runId: number;
    turnId: number;
    messageId?: number;
    dbContent: string;
    source: Record<string, unknown>;
};
export declare function emitAgentMessageSseDebug(input: {
    tag: string;
    sessionId: string;
    runId?: number;
    turnId?: number;
    ssePayload: Record<string, unknown>;
    source: Record<string, unknown>;
}): string | null;
export declare function emitAgentMessagePersistDebug(input: {
    tag: string;
    sessionId: string;
    runId: number;
    turnId: number;
    messageId?: number;
    dbContent: string;
    source: Record<string, unknown>;
}): string | null;
export declare function blocksSourceSnapshot(blocks: MessageBlock[], options?: {
    label?: string;
}): Record<string, unknown>;
export declare function serializedSourceSnapshot(serialized: string, options?: {
    label?: string;
    blocks?: MessageBlock[];
}): Record<string, unknown>;
export declare function logPersistContentMismatch(input: {
    sessionId: string;
    runId: number;
    turnId: number;
    tag: string;
    artifactSerialized: string;
    priorDbContent: string;
}): void;
