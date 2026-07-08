import type { MessageBlock } from '../../message/message-blocks.types';
import type { PlanHostFillEntry } from './plan-host-fill.util';
import type { AgentRunSseEmitter } from '../run/agent-run-sse.emitter';
import type { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';
export declare function buildPlanReasonHostUserMarkdown(input: {
    fills: PlanHostFillEntry[];
    stepObjective?: string | null;
}): string;
export type PlanReasonHostUserLayerPublishDeps = {
    sse: Pick<AgentRunSseEmitter, 'publishAssistantBlocks'>;
    assistantArtifact: Pick<RunAssistantArtifactStore, 'peekBlocks' | 'peekTurnId'>;
};
export declare function publishPlanReasonHostUserLayer(deps: PlanReasonHostUserLayerPublishDeps, input: {
    sessionId: string;
    runId: number;
    turnId?: number;
    userMarkdown: string;
}): {
    draftReply: string;
    blocks: MessageBlock[];
    serialized: string;
};
