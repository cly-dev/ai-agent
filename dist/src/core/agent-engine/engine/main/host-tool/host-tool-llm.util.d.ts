import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import type { HostActionSsePayload } from '../../../../host-bridge/host-action.types';
import type { GraphToolCall } from '../types/agent-engine.types';
import type { TaskPlanAdvanceResult, TaskPlanSnapshot, TaskPlanStep } from '../plan/task-plan.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
export type HostToolStepSkipReason = 'no_scoped_host_tools' | 'host_tool_name_mismatch' | 'no_host_tool_calls' | 'unexpected_http_tool_calls' | 'required_host_tool_missed' | 'turn_contract_host_tool_blocked' | 'undispatchable_page_anchor';
export type HostToolPlanStepHandleResult = {
    planAdvance: TaskPlanAdvanceResult;
    observations: Array<{
        name: string;
        output: Record<string, unknown>;
    }>;
    ssePayload?: HostActionSsePayload;
    skipReason?: HostToolStepSkipReason;
};
export declare function evaluateHostToolPreLlmSkip(input: {
    pendingHostStep: TaskPlanStep | null;
    taskPlan: TaskPlanSnapshot | null | undefined;
    hostToolsForPrompt: HostToolDecisionDefinition[];
    scopedHostTools: HostToolDecisionDefinition[];
}): HostToolStepSkipReason | null;
export declare function evaluateHostToolPostLlm(input: {
    pendingHostStep: TaskPlanStep | null;
    taskPlan: TaskPlanSnapshot | null | undefined;
    hostCalls: GraphToolCall[];
    httpCalls: GraphToolCall[];
    hasToolCalls: boolean;
    scopedHostTools: HostToolDecisionDefinition[];
    pageContext?: AgentChatPageContext | null;
}): {
    action: 'dispatch';
    hostCalls: GraphToolCall[];
    planStepId: string;
} | {
    action: 'skip';
    planStepId: string;
    reason: HostToolStepSkipReason;
    hostCalls?: GraphToolCall[];
    httpCalls?: GraphToolCall[];
} | {
    action: 'required_missed';
    planStepId: string;
    reason: 'required_host_tool_missed';
    hostCalls?: GraphToolCall[];
    httpCalls?: GraphToolCall[];
} | {
    action: 'none';
};
export declare function finalizeHostToolPlanStep(input: {
    taskPlan: TaskPlanSnapshot;
    planStepId: string;
    hostCalls?: GraphToolCall[];
    httpCalls?: GraphToolCall[];
    skipReason?: HostToolStepSkipReason;
    pageContext?: AgentChatPageContext | null;
    scopedHostTools?: HostToolDecisionDefinition[];
    runId?: number;
    turnId?: number;
    streamReconciled?: boolean;
}): HostToolPlanStepHandleResult | null;
export declare function skipPendingHostToolStepsByContract(input: {
    taskPlan: TaskPlanSnapshot;
    pageContext?: AgentChatPageContext | null;
    runId?: number;
    turnId?: number;
}): {
    plan: TaskPlanSnapshot;
    skippedStepIds: string[];
    observations: Array<{
        name: string;
        output: Record<string, unknown>;
    }>;
};
