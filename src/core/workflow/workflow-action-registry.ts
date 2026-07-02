import type { WorkflowActionKind, WorkflowProfile } from './workflow.types';

export type WorkflowActionRegistryEntry = {
  kind: WorkflowActionKind;
  /** 为 false 时禁止写入 Workflow 资产（目录可见，运行时尚未上线）。 */
  implemented: boolean;
  allowedProfiles: readonly WorkflowProfile[];
  batch: 'A' | 'B';
};

export const WORKFLOW_ACTION_REGISTRY: readonly WorkflowActionRegistryEntry[] = [
  {
    kind: 'load_page_context',
    implemented: true,
    allowedProfiles: ['page_action', 'chat_skill', 'shared'],
    batch: 'A',
  },
  {
    kind: 'fetch_data',
    implemented: true,
    allowedProfiles: ['page_action', 'chat_skill', 'shared'],
    batch: 'A',
  },
  {
    kind: 'generate_and_push',
    implemented: true,
    allowedProfiles: ['page_action', 'chat_skill', 'shared'],
    batch: 'A',
  },
  {
    kind: 'summarize',
    implemented: true,
    allowedProfiles: ['page_action', 'chat_skill', 'shared'],
    batch: 'A',
  },
  {
    kind: 'compose_mutation',
    implemented: true,
    allowedProfiles: ['page_action', 'chat_skill', 'shared'],
    batch: 'B',
  },
  {
    kind: 'present_mutation',
    implemented: true,
    allowedProfiles: ['page_action', 'chat_skill', 'shared'],
    batch: 'B',
  },
  {
    kind: 'write_data',
    implemented: true,
    allowedProfiles: ['page_action', 'chat_skill', 'shared'],
    batch: 'B',
  },
  {
    kind: 'await_user_confirm',
    implemented: true,
    allowedProfiles: ['page_action', 'chat_skill', 'shared'],
    batch: 'B',
  },
] as const;

export const WORKFLOW_ACTION_KINDS: readonly WorkflowActionKind[] =
  WORKFLOW_ACTION_REGISTRY.map((entry) => entry.kind);

export function getWorkflowActionRegistryEntry(
  kind: string,
): WorkflowActionRegistryEntry | null {
  return (
    WORKFLOW_ACTION_REGISTRY.find((entry) => entry.kind === kind) ?? null
  );
}

export function isWorkflowActionKind(value: string): value is WorkflowActionKind {
  return getWorkflowActionRegistryEntry(value) != null;
}

export function workflowProfileAllowsAction(
  _profile: WorkflowProfile,
  kind: WorkflowActionKind,
): boolean {
  const entry = getWorkflowActionRegistryEntry(kind);
  return entry?.implemented === true;
}
