import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import type { ToolObservation } from '../types/agent-engine.types';
import type { MessageBlock } from '../../message/message-blocks.types';
export declare const HOST_WRITE_CHANNEL_CONSTRAINT = "host_write_channel";
export declare function planHasHostWriteChannel(plan: TaskPlanSnapshot | null | undefined): boolean;
export declare function findDispatchedHostToolObservation(observations: ToolObservation[]): ToolObservation | null;
export type HostToolPushSuccessContent = {
    plainText: string;
    blocks: MessageBlock[];
    summaryStepName: string;
};
export declare function resolveHostToolPushSuccessContent(input: {
    taskPlan: TaskPlanSnapshot | null | undefined;
    observations: ToolObservation[];
}): HostToolPushSuccessContent | null;
