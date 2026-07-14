import type { AgentEngineTool, GraphToolCall } from '../main/types/agent-engine.types';
import type { TaskPlanStep } from '../main/plan/task-plan.types';
import type { TurnRespondMissingField, TurnRespondRequest } from './turn-respond.types';
import { type PlanToolCandidateTool } from '../main/plan/plan-tool-candidates.util';
export declare function listMissingUserFacingParamsForToolCall(input: {
    call: GraphToolCall;
    tool: PlanToolCandidateTool;
}): TurnRespondMissingField[];
export type ToolParamGateResult = {
    status: 'ready';
} | {
    status: 'clarify';
    missingFields: TurnRespondMissingField[];
    toolName: string;
};
export declare function assessHttpToolCallsParamGate(input: {
    calls: GraphToolCall[];
    scopedTools: AgentEngineTool[];
    candidateTools?: AgentEngineTool[] | null;
}): ToolParamGateResult;
export declare function buildParamGateClarificationRequest(input: {
    userMessage: string;
    planStep: TaskPlanStep;
    missingFields: TurnRespondMissingField[];
    toolName: string;
}): TurnRespondRequest;
