import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import type { PendingRespond } from '../agent-engine/engine/turn/turn-respond.types';
export type WorkflowInitSkipReason = 'no_task_plan' | 'resume_defs_mismatch' | 'db_load_failed' | 'compile_empty' | 'scope_mismatch' | 'trigger_permission_denied';
export declare function hasWorkflowInitSkippedStep(steps: AgentGraphState['steps'] | undefined): boolean;
export declare function latestWorkflowInitSkipReason(steps: AgentGraphState['steps'] | undefined): WorkflowInitSkipReason | null;
export declare function isWorkflowInitSkipReason(value: unknown): value is WorkflowInitSkipReason;
export declare function buildWorkflowInitSkippedGuidance(reason: WorkflowInitSkipReason): string;
export declare function guidanceForWorkflowInitSkippedReadinessReason(readinessReason: string | undefined): string | null;
export declare function buildWorkflowInitSkippedPendingRespond(input: {
    reason: WorkflowInitSkipReason;
    userMessage: string;
}): PendingRespond | null;
