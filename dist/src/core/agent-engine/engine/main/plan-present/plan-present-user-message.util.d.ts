import type { MessageBlock } from '../../message/message-blocks.types';
import type { AgentEngineTool } from '../types/agent-engine.types';
import type { PlanComposeWriteObservationOutput } from './plan-compose-write.util';
import { type PlanDraftSummarizePendingWrite } from './plan-draft-summarize.util';
import type { AgentRunSseEmitter } from '../run/agent-run-sse.emitter';
import type { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
export type PlanPresentUserLayerSnapshot = PlanDraftSummarizePendingWrite & {
    blocks: MessageBlock[];
    serialized: string;
};
export type PlanPresentMachineLayerSnapshot = {
    machineLayer: PlanComposeWriteObservationOutput;
    machineLayerDirty: boolean;
};
export type PlanPresentUserLayerPublishDeps = {
    sse: Pick<AgentRunSseEmitter, 'publishAssistantBlocks'>;
    assistantArtifact: Pick<RunAssistantArtifactStore, 'peekBlocks' | 'peekTurnId'>;
};
export declare function sanitizePlanPresentUserMarkdown(raw: string): string;
export declare function resolvePlanPresentUserMarkdown(input: {
    streamedOrLlmMarkdown: string;
    machineSubmitText?: string | null;
}): string;
export declare function buildPlanPresentUserMessageBlocks(userMarkdown: string): MessageBlock[];
export declare function publishPlanPresentUserLayer(deps: PlanPresentUserLayerPublishDeps, input: {
    sessionId: string;
    runId: number;
    turnId?: number;
    userMarkdown: string;
    machineSubmitText?: string | null;
}): Pick<PlanPresentUserLayerSnapshot, 'draftReply' | 'blocks' | 'serialized'>;
export declare function finalizePlanPresentUserLayer(deps: PlanPresentUserLayerPublishDeps, input: {
    sessionId: string;
    runId: number;
    turnId?: number;
    machineLayer: PlanComposeWriteObservationOutput;
    userMarkdown: string;
    taskPlanBeforeFinalize: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
}): PlanPresentUserLayerSnapshot;
