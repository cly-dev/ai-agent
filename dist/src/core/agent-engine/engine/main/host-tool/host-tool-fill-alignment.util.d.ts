import type { ToolObservation } from '../types/agent-engine.types';
import type { MessageBlock } from '../../message/message-blocks.types';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
export declare function findPrecedingReasonStepId(plan: TaskPlanSnapshot, beforeStepId: string): string | null;
export declare function extractHostToolDispatchedFillText(input: {
    observations: ToolObservation[];
    planStepId?: string | null;
}): string | null;
export declare function resolveReasonDraftForHostToolStep(input: {
    taskPlan: TaskPlanSnapshot;
    observations: ToolObservation[];
    artifactBlocks?: MessageBlock[] | null;
}): string | null;
export declare function buildPlanContextForSummarize(plan: TaskPlanSnapshot | null | undefined, observations?: ToolObservation[]): string | null;
export declare function formatHostToolFillContextForTerminalSummarize(plan: TaskPlanSnapshot | null | undefined, observations: ToolObservation[]): string | null;
