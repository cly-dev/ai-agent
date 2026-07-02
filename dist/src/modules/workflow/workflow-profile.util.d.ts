import type { WorkflowProfile } from '../../../generated/prisma/client';
export type WorkflowEntryKind = 'skill' | 'page_action';
export declare function isWorkflowProfileCompatibleWithEntry(_profile: WorkflowProfile, _entry: WorkflowEntryKind): boolean;
