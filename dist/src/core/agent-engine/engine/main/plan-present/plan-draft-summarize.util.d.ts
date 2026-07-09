import type { AgentEngineTool, GraphToolCall, ToolObservation } from '../types/agent-engine.types';
import type { PlanComposeWriteObservationOutput } from './plan-compose-write.util';
import { type PlanExecutionContext } from '../plan/task-plan.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
export type PendingWriteToolCallPayload = {
    tool: string;
    arguments: Record<string, unknown>;
};
export type PlanDraftSummarizePendingWrite = {
    draftReply: string;
    submitText: string;
    pendingWriteToolCall: GraphToolCall | null;
};
export type PlanPresentSummarizeResult = PlanDraftSummarizePendingWrite & {
    serialized: string;
    machineLayer: PlanComposeWriteObservationOutput | null;
    machineLayerDirty: boolean;
};
export type FinalizePlanPendingWriteResult = {
    call: GraphToolCall | null;
    failureReason?: string;
};
export type ComposedWriteGateDiagnostic = {
    composedTool: string;
    composedPlanStepId: string | null;
    taskPlanCurrentStepId: string | null;
    composedArgsSummary: string;
    normalizedArgsSummary: string;
    submitTextPreview: string | null;
    submitTextUsable: boolean;
    pageContextEntityId: string | null;
    writeToolResolved: boolean;
};
export type FinalizeComposedWriteResult = FinalizePlanPendingWriteResult & {
    diagnostic: ComposedWriteGateDiagnostic;
};
export type ResolveComposedWriteGateResult = FinalizeComposedWriteResult & {
    stage: 'ok' | 'missing_task_plan' | 'missing_plan_compose_write' | 'finalize_failed';
};
export type ResolvePendingWriteForPlanWriteStepResult = {
    call: GraphToolCall | null;
    failureReason?: string;
    source?: 'compose' | 'draft_reply' | null;
    gateDiagnostic?: ComposedWriteGateDiagnostic;
};
export declare function summarizeWriteArgsForGateLog(value: Record<string, unknown>): string;
export declare function formatComposedWriteGateDiagnosticForLog(result: Pick<FinalizeComposedWriteResult, 'failureReason' | 'diagnostic'> & {
    call: GraphToolCall | null;
}): string;
export declare function isPlanDraftSummarizeBeforeWrite(ctx: PlanExecutionContext): boolean;
export declare function isPlanDraftToolObservationDump(text: string): boolean;
export declare function isUsablePlanDraftUserFacingDraft(draft: string): boolean;
export declare function isUsablePlanMutationPreviewDraft(draft: string, writeTool?: Pick<AgentEngineTool, 'inputSchema' | 'schema' | 'agentMetadata' | 'description'>, machineSubmitText?: string | null): boolean;
export declare function resolveSubmitTextForWriteTool(input: {
    draftReply: string;
    arguments: Record<string, unknown>;
    writeTool: AgentEngineTool | undefined;
}): string;
export declare function buildFallbackUserDraftFromSubmitText(submitText: string): string;
export declare function finalizeComposedWritePendingCallResult(input: {
    composed: PlanComposeWriteObservationOutput;
    taskPlan: TaskPlanSnapshot;
    scopedTools: AgentEngineTool[];
    observations: ToolObservation[];
    pageContext?: AgentChatPageContext | null;
}): FinalizeComposedWriteResult;
export declare function finalizeComposedWritePendingCall(input: {
    composed: PlanComposeWriteObservationOutput;
    taskPlan: TaskPlanSnapshot;
    scopedTools: AgentEngineTool[];
    observations: ToolObservation[];
    pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null;
export declare function resolveComposedWriteGateCallResult(input: {
    observations: ToolObservation[];
    taskPlan: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
    pageContext?: AgentChatPageContext | null;
}): ResolveComposedWriteGateResult;
export declare function resolveComposedWriteGateCall(input: {
    observations: ToolObservation[];
    taskPlan: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
    pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null;
export declare function resolvePendingWriteForPlanWriteStepResult(input: {
    observations: ToolObservation[];
    taskPlan: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
    pageContext?: AgentChatPageContext | null;
}): ResolvePendingWriteForPlanWriteStepResult;
export declare function resolvePendingWriteForPlanWriteStep(input: {
    observations: ToolObservation[];
    taskPlan: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
    pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null;
export declare function finalizeDraftReplyPendingWriteCall(input: {
    tool: string;
    arguments: Record<string, unknown>;
    taskPlan: TaskPlanSnapshot;
    scopedTools: AgentEngineTool[];
    observations: ToolObservation[];
    pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null;
export declare function resolvePendingWriteFromComposedObservation(input: {
    observations: ToolObservation[];
    taskPlan: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
    pageContext?: AgentChatPageContext | null;
}): GraphToolCall | null;
export declare function syncPlanPresentSubmitTextForGate(input: {
    submitText: string;
    gateCall: GraphToolCall;
    observations: ToolObservation[];
    taskPlan: TaskPlanSnapshot;
    scopedTools: AgentEngineTool[];
}): string;
export declare function resolvePlanDraftReplyContentForGateObservation(input: {
    draftReply: string;
    submitText: string;
    gateCall: GraphToolCall;
    writeTool?: AgentEngineTool;
}): {
    draftReply: string;
    submitText: string;
} | null;
export declare function buildWriteConfirmationDetailMarkdown(gateCall: GraphToolCall, writeTool: AgentEngineTool): string;
export declare function finalizePlanPendingWriteToolCall(input: {
    payload: PendingWriteToolCallPayload;
    taskPlan: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
    submitText: string;
}): FinalizePlanPendingWriteResult;
export declare function finalizePlanPendingWriteToolCallFromComposedArgs(input: {
    payload: PendingWriteToolCallPayload;
    taskPlan: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
}): FinalizePlanPendingWriteResult;
export declare function buildPlanPresentUserLayer(input: {
    composed: PlanComposeWriteObservationOutput;
    draftReply: string;
    taskPlanBeforeFinalize: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
}): Pick<PlanDraftSummarizePendingWrite, 'draftReply' | 'submitText'>;
