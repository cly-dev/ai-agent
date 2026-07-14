import { type AgentToolErrorObservation } from '../agent-run-user-messages.util';
import type { ToolObservation } from '../main/types/agent-engine.types';
import type { TaskPlanSnapshot } from '../main/plan/task-plan.types';
import { type ToolCallLike } from './tool-call-dedupe.util';
export declare function resolveToolErrorHttpStatus(output: unknown): number | undefined;
export declare function isRecoverableParameterToolError(output: unknown): boolean;
export declare function isTerminalPlanToolError(output: unknown): boolean;
export declare function shouldAbortPlanOnTerminalToolError(input: {
    reason: string;
    errorOutput: unknown;
    taskPlan: TaskPlanSnapshot | null | undefined;
}): boolean;
export declare function shouldAbortPlanOnRecoverableSameArgs(input: {
    reason: string;
    taskPlan: TaskPlanSnapshot | null | undefined;
}): boolean;
export declare function findLastRecoverableToolErrorObservation(observations: ToolObservation[]): {
    name: string;
    output: AgentToolErrorObservation;
    args: Record<string, unknown>;
} | null;
export declare function pendingCallsRepeatRecoverableToolError(input: {
    pendingToolCalls: ToolCallLike[];
    observations: ToolObservation[];
}): {
    repeat: boolean;
    errorOutput?: AgentToolErrorObservation;
};
export declare function buildSameArgsRepeatUserHint(errorOutput: AgentToolErrorObservation): string;
