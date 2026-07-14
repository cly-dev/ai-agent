import type { GraphToolCall } from '../types/agent-engine.types';
import type { AgentRunStep } from '../types/agent-engine.types';
import type { HostActionHostToolInvocation } from '../../../../host-bridge/host-action.types';
import type { HostToolPlanStepHandleResult, HostToolStepSkipReason } from './host-tool-llm.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
export type HostToolRunStepStatus = 'dispatched' | 'skipped' | 'required_missed' | 'completion_dispatched' | 'completion_skipped';
export type HostToolRunStepReason = 'plan_host_tool' | 'agent_mutation_success';
export type HostToolPlanRunStatus = 'none' | 'available_not_planned' | 'planned';
export declare function resolveHostToolPlanRunStatus(input: {
    availableHostToolCount: number;
    taskPlan: TaskPlanSnapshot;
}): {
    plannedHostToolStepIds: string[];
    hostToolRunStatus: HostToolPlanRunStatus;
};
export declare function buildHostToolRunStep(input: {
    existingSteps: AgentRunStep[];
    status: HostToolRunStepStatus;
    reason: HostToolRunStepReason;
    planStepId?: string | null;
    pageScope?: string | null;
    hostTools?: Array<{
        name: string;
        args?: Record<string, unknown>;
    }>;
    skipReason?: HostToolStepSkipReason | string | null;
    sseDispatched?: boolean;
}): AgentRunStep;
export declare function buildHostToolRunStepFromPlanHandle(input: {
    existingSteps: AgentRunStep[];
    handle: HostToolPlanStepHandleResult;
    planStepId: string;
    pageScope?: string | null;
}): AgentRunStep;
export declare function buildHostToolRequiredMissedStep(input: {
    existingSteps: AgentRunStep[];
    planStepId: string;
    pageScope?: string | null;
    skipReason: HostToolStepSkipReason;
    hostCalls?: GraphToolCall[];
}): AgentRunStep;
export declare function buildCompletionHostToolRunStep(input: {
    existingSteps: AgentRunStep[];
    pageScope?: string | null;
    hostTools: HostActionHostToolInvocation[];
    sseDispatched: boolean;
}): AgentRunStep;
