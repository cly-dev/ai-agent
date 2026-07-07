import type { LlmChatMessage } from '../../../../llm/llm.types';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import type { ToolObservation } from '../types/agent-engine.types';
import type { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import { type PlanReasonHostMachineLayerDeps } from './plan-reason-host-machine-layer.util';
import { type PlanReasonHostUserLayerPublishDeps } from './plan-reason-host-user-message.util';
export type PlanReasonHostFillOrchestrateDeps = PlanReasonHostUserLayerPublishDeps & PlanReasonHostMachineLayerDeps & {
    assistantArtifact: Pick<RunAssistantArtifactStore, 'peekBlocks' | 'peekTurnId'>;
};
export type RunPlanReasonHostFillInput = {
    userMessage: string;
    mergedObservation: ToolObservation;
    toolObservations: ToolObservation[];
    promptMessages: LlmChatMessage[];
    sessionId: string;
    runId: number;
    turnId?: number;
    scope: {
        appClientId: number;
        agentId: number;
    };
    taskPlan: TaskPlanSnapshot;
    scopedHostTools: HostToolDecisionDefinition[];
    pageContext?: AgentChatPageContext | null;
};
export type PlanReasonHostFillResult = {
    serialized: string;
    draftReply: string;
    submitText: string;
    hostFillObservation: ToolObservation;
    draftReplyObservation: ToolObservation;
    hostToolStreamObservation?: ToolObservation;
    hostToolDispatchObservations?: ToolObservation[];
};
export declare function runPlanReasonHostFill(deps: PlanReasonHostFillOrchestrateDeps, input: RunPlanReasonHostFillInput): Promise<PlanReasonHostFillResult>;
