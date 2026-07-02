import type { WorkflowProfile } from '../../../generated/prisma/client';

export type WorkflowEntryKind = 'skill' | 'page_action';

export function isWorkflowProfileCompatibleWithEntry(
  _profile: WorkflowProfile,
  _entry: WorkflowEntryKind,
): boolean {
  // Workflow profile 仅为元数据标签；Skill / PageAction 均可引用任意 Workflow。
  return true;
}
