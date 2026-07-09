export type AutomationTriggerSource = 'page_action' | 'webhook';

export type AutomationTaskRefKind = 'page_action_run' | 'webhook_approval';

export type AutomationTaskRef =
  | { kind: 'page_action_run'; id: number }
  | { kind: 'webhook_approval'; id: number };

import type { PageActionTaskStatus } from '../../core/page-action/page-action-task-status.util';

export type AutomationTaskStatus = PageActionTaskStatus;

export const AUTOMATION_TASK_STATUSES = [
  'running',
  'awaiting_approval',
  'completed',
  'failed',
  'cancelled',
  'active',
  'all',
] as const;

export type AutomationTaskStatusFilter = (typeof AUTOMATION_TASK_STATUSES)[number];

export const AUTOMATION_TRIGGER_SOURCES = [
  'page_action',
  'webhook',
  'all',
] as const;

export type AutomationTriggerSourceFilter =
  (typeof AUTOMATION_TRIGGER_SOURCES)[number];

export type AutomationTaskListItem = {
  ref: AutomationTaskRef;
  triggerSource: AutomationTriggerSource;
  taskStatus: AutomationTaskStatus;
  /** 与 taskStatus 对齐：仅 completed 且无 errorCode 时为 true；审批通过不等于成功。 */
  succeeded: boolean;
  title: string;
  subtitle: string | null;
  pageActionKey: string | null;
  workflowKey: string | null;
  workflowName: string | null;
  createdAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  approval: { id: number; status: string } | null;
  outputs: {
    preview: string | null;
    /** 终态任务列表返回完整正文；详情始终返回完整正文。 */
    fillText: string | null;
    hasFillText: boolean;
  };
};

export type AutomationTaskDetailOutputs = AutomationTaskListItem['outputs'];

export type AutomationTaskTimelineEntry = {
  step: number;
  type: string;
  name: string;
  at: string;
  status?: string;
};

export type AutomationTaskDetail = Omit<AutomationTaskListItem, 'outputs'> & {
  outputs: AutomationTaskDetailOutputs;
  actionKey: string;
  instruction: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  streamUrl: string;
  timeline: AutomationTaskTimelineEntry[];
  workflowRun: unknown | null;
};

export type AutomationTaskListFilter = {
  appClientId: number;
  userId: number;
  status?: AutomationTaskStatusFilter;
  triggerSource?: AutomationTriggerSourceFilter;
  actionKey?: string;
  workflowKey?: string;
  limit?: number;
  offset?: number;
};
