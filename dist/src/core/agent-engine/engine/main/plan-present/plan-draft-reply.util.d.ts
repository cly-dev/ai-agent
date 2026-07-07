import type { MessageBlock } from '../../message/message-blocks.types';
import type { AgentEngineTool, GraphToolCall, ToolObservation } from '../types/agent-engine.types';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
export declare const PLAN_DRAFT_REPLY_OBSERVATION_NAME = "plan_draft_reply";
export type PlanDraftReplyObservationOutput = {
    draftReply: string;
    submitText: string;
    planStepId?: string | null;
    pendingWriteToolCall?: {
        tool: string;
        arguments: Record<string, unknown>;
    } | null;
};
export declare function buildPlanDraftReplyObservation(input: {
    draftReply: string;
    submitText?: string | null;
    planStepId?: string | null;
    pendingWriteToolCall?: GraphToolCall | null;
}): ToolObservation;
export declare function resolveLatestPlanDraftReply(observations: ToolObservation[]): PlanDraftReplyObservationOutput | null;
export declare function resolvePlanDraftReplyText(input: {
    observations: ToolObservation[];
    artifactBlocks?: MessageBlock[] | null;
}): string | null;
export declare function resolvePlanSubmitTextForWrite(input: {
    observations: ToolObservation[];
    artifactBlocks?: MessageBlock[] | null;
    scopedTools?: AgentEngineTool[];
}): string | null;
export declare function applyPlanDraftToWriteToolCalls(toolCalls: GraphToolCall[], taskPlan: TaskPlanSnapshot | null | undefined, scopedTools: AgentEngineTool[], submitText: string | null | undefined): GraphToolCall[];
