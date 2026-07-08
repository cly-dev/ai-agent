export type AutomationTriggerSource = 'page_action' | 'webhook';
export type AutomationTaskRefKind = 'page_action_run' | 'webhook_approval';
export type AutomationTaskRef = {
    kind: 'page_action_run';
    id: number;
} | {
    kind: 'webhook_approval';
    id: number;
};
import type { PageActionTaskStatus } from '../../core/page-action/page-action-task-status.util';
export type AutomationTaskStatus = PageActionTaskStatus;
export declare const AUTOMATION_TASK_STATUSES: readonly ["running", "awaiting_approval", "completed", "failed", "cancelled", "active", "all"];
export type AutomationTaskStatusFilter = (typeof AUTOMATION_TASK_STATUSES)[number];
export declare const AUTOMATION_TRIGGER_SOURCES: readonly ["page_action", "webhook", "all"];
export type AutomationTriggerSourceFilter = (typeof AUTOMATION_TRIGGER_SOURCES)[number];
export type AutomationTaskListItem = {
    ref: AutomationTaskRef;
    triggerSource: AutomationTriggerSource;
    taskStatus: AutomationTaskStatus;
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
    approval: {
        id: number;
        status: string;
    } | null;
    outputs: {
        preview: string | null;
        hasFillText: boolean;
    };
};
export type AutomationTaskDetailOutputs = AutomationTaskListItem['outputs'] & {
    fillText: string | null;
};
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
