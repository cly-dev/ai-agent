import type { ToolLevel } from '../../../generated/prisma/client';
import type { MessageBlock } from '../agent-engine/engine/message/message-blocks.types';
export type WriteDraftLastEvent = 'composed' | 'suspended' | 'user_edit' | 'retry';
export type WriteDraft = {
    schemaVersion: 1;
    version: number;
    tool: {
        name: string;
        toolId?: number;
        riskLevel: ToolLevel | string;
    };
    arguments: Record<string, unknown>;
    presentation: {
        summaryText?: string | null;
        previewBlocks: MessageBlock[];
    };
    provenance: {
        draftRetryCount: number;
        composedAt: string;
        lastEvent: WriteDraftLastEvent;
    };
};
export type WriteDraftPublic = {
    version: number;
    tool: {
        name: string;
        toolId?: number;
        riskLevel: string;
    };
    arguments: Record<string, unknown>;
    presentation: {
        summaryText?: string | null;
        previewBlocks: MessageBlock[];
    };
    provenance: {
        draftRetryCount: number;
        draftRetryMax: number;
        canRetry: boolean;
        composedAt: string;
        lastEvent: WriteDraftLastEvent;
    };
};
export type BuildPageWriteDraftInput = {
    tool: {
        name: string;
        toolId?: number;
        riskLevel: ToolLevel | string;
        arguments: Record<string, unknown>;
    };
    summaryText?: string | null;
    fillText?: string;
    draftRetryCount?: number;
    version?: number;
    lastEvent?: WriteDraftLastEvent;
    composedAt?: string;
};
