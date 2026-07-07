import type { GraphToolCall, ToolObservation } from '../types/agent-engine.types';
import type { AgentEngineTool } from '../types/agent-engine.types';
import { PLAN_COMPOSE_WRITE_STEP_ID, PLAN_PRESENT_STEP_ID } from '../plan/task-plan.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
export declare const PLAN_COMPOSE_WRITE_OBSERVATION_NAME = "plan_compose_write";
export { PLAN_COMPOSE_WRITE_STEP_ID, PLAN_PRESENT_STEP_ID };
export type PlanComposeWriteObservationOutput = {
    tool: string;
    arguments: Record<string, unknown>;
    planStepId?: string | null;
};
export declare function buildPlanComposeWriteObservation(input: {
    toolCall: GraphToolCall;
    planStepId?: string | null;
}): ToolObservation;
export declare function resolveLatestPlanComposeWrite(observations: ToolObservation[]): PlanComposeWriteObservationOutput | null;
export declare function patchLatestPlanComposeWriteObservation(observations: ToolObservation[], machineLayer: PlanComposeWriteObservationOutput): {
    observations: ToolObservation[];
    patched: boolean;
};
export declare function pickComposeWriteToolCall(toolCalls: GraphToolCall[], scopedTools: AgentEngineTool[], taskPlan: TaskPlanSnapshot, workflowRun?: WorkflowRunState | null, workflowNodeDefs?: WorkflowNodeDef[] | null): GraphToolCall | null;
export declare function buildReadToolObservationMatcher(scopedTools: AgentEngineTool[]): (toolName: string) => boolean;
export declare function prepareComposeWriteToolCall(input: {
    toolCall: GraphToolCall;
    writeTool: AgentEngineTool;
    observations: ToolObservation[];
    scopedTools: AgentEngineTool[];
    pageContext?: AgentChatPageContext | null;
}): GraphToolCall;
export type ComposeMutationInterceptResult = {
    kind: 'not_applicable';
} | {
    kind: 'no_allowed_call';
} | {
    kind: 'applied';
    preparedCall: GraphToolCall;
    composeObservation: ToolObservation;
};
export declare function tryInterceptComposeMutationToolCalls(input: {
    toolCalls: GraphToolCall[];
    taskPlan: TaskPlanSnapshot;
    scopedTools: AgentEngineTool[];
    observations: ToolObservation[];
    pageContext?: AgentChatPageContext | null;
    planStepId: string;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): ComposeMutationInterceptResult;
