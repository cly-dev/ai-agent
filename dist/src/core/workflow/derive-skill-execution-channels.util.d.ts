import type { WorkflowDeliverable } from '../../../generated/prisma/client';
import type { WorkflowNodeDef } from './workflow.types';
export type SkillExecutionChannels = {
    httpRead: boolean;
    httpMutation: boolean;
    hostPush: boolean;
    primaryWriteChannel: 'http' | 'host' | null;
};
export declare const EMPTY_SKILL_EXECUTION_CHANNELS: SkillExecutionChannels;
export declare function deriveSkillExecutionChannels(input: {
    nodes?: WorkflowNodeDef[];
    deliverable?: WorkflowDeliverable | string | null;
    skillToolIds: readonly number[];
    hostToolIds: readonly number[];
}): SkillExecutionChannels;
