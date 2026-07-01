import type { WorkflowProfile } from '../../../generated/prisma/client';

export type WorkflowEntryKind = 'skill' | 'page_action';

export function isWorkflowProfileCompatibleWithEntry(
  profile: WorkflowProfile,
  entry: WorkflowEntryKind,
): boolean {
  if (profile === 'shared') {
    return true;
  }
  if (entry === 'skill') {
    return profile === 'chat_skill';
  }
  return profile === 'page_action';
}
