import type { WorkflowDeliverable } from '../../../generated/prisma/client';
import type { WorkflowIrDocument } from './workflow-ir.types';
import type { SkillExecutionChannels } from './derive-skill-execution-channels.util';
export declare function deriveSkillExecutionChannelsFromIr(input: {
    ir: WorkflowIrDocument;
    deliverable?: WorkflowDeliverable | string | null;
}): SkillExecutionChannels;
