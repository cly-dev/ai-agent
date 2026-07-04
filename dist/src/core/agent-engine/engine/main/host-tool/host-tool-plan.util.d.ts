import type { GraphToolCall } from '../types/agent-engine.types';
import type { TaskPlanAdvanceResult, TaskPlanSnapshot, TaskPlanStep } from '../plan/task-plan.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
export declare function filterHostToolsForPlanStep(hostTools: HostToolDecisionDefinition[], taskPlan: TaskPlanSnapshot | null | undefined): HostToolDecisionDefinition[];
export declare function collectRequiredHostToolNamesForPlanStep(pendingHostStep: TaskPlanStep | null, scopedHostTools: HostToolDecisionDefinition[]): Set<string>;
export declare function enrichPlanStepsWithHostTools(plan: TaskPlanSnapshot, scopedHostTools: HostToolDecisionDefinition[]): {
    plan: TaskPlanSnapshot;
    prunedHostToolStepIds: string[];
};
export declare function collectRemovedPendingHostToolStepIds(before: TaskPlanSnapshot | null | undefined, after: TaskPlanSnapshot | null | undefined): string[];
export declare function partitionToolCallsByHost(toolCalls: GraphToolCall[], hostToolNames: Set<string>): {
    httpCalls: GraphToolCall[];
    hostCalls: GraphToolCall[];
};
export declare function partitionDecisionToolCalls(toolCalls: GraphToolCall[], pendingHostStep: TaskPlanStep | null, allowedHostToolNames: Set<string>): {
    httpCalls: GraphToolCall[];
    hostCalls: GraphToolCall[];
};
export declare function hostToolCallsMatchPlanStep(step: TaskPlanStep, hostCalls: GraphToolCall[]): boolean;
export declare const HOST_TOOL_INVOKE_OBSERVATION_NAME = "host_tool_invoke";
export declare function buildHostToolDispatchObservations(input: {
    hostCalls: GraphToolCall[];
    planStepId: string;
}): Array<{
    name: string;
    output: Record<string, unknown>;
}>;
export declare function buildHostToolSkippedObservation(input: {
    planStepId: string;
    reason: string;
    hostCalls?: GraphToolCall[];
    httpCalls?: GraphToolCall[];
}): {
    name: string;
    output: Record<string, unknown>;
};
export declare function advanceHostToolPlanStep(plan: TaskPlanSnapshot, input: {
    planStepId: string;
    hostCalls?: GraphToolCall[];
    requireMatch?: boolean;
}): TaskPlanAdvanceResult | null;
