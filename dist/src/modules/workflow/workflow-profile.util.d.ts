import type { WorkflowProfile } from '../../../generated/prisma/client';
export type WorkflowEntryKind = 'skill' | 'page_action';
export declare function isWorkflowProfileCompatibleWithEntry(profile: WorkflowProfile, entry: WorkflowEntryKind): boolean;
