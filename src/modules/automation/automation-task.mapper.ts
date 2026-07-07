import type { PageActionRunStatus, Prisma } from '../../../generated/prisma/client';
import { buildPageActionRunStreamPath } from '../../core/page-action/page-action.constants';
import { toPublicPageActionRunTimeline } from '../../core/page-action/page-action-run-steps.util';
import type { AgentChatPageContext } from '../../core/host-bridge/page-context.types';
import { assessPageContextData } from '../../core/host-bridge/page-context-usage.util';
import type {
  AutomationTaskDetail,
  AutomationTaskListItem,
  AutomationTaskStatus,
  AutomationTaskTimelineEntry,
} from './automation.types';

export const AUTOMATION_PAGE_ACTION_RUN_INCLUDE = {
  pageAction: {
    select: {
      actionKey: true,
      name: true,
      workflowId: true,
      workflow: { select: { workflowKey: true, name: true } },
    },
  },
  approvalRequest: { select: { id: true, status: true } },
} satisfies Prisma.PageActionRunInclude;

export type AutomationPageActionRunRow = Prisma.PageActionRunGetPayload<{
  include: typeof AUTOMATION_PAGE_ACTION_RUN_INCLUDE;
}>;

function previewText(value: string | null | undefined, max = 120): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function mapRunStatus(status: PageActionRunStatus): AutomationTaskStatus {
  switch (status) {
    case 'running':
      return 'running';
    case 'awaiting_approval':
      return 'awaiting_approval';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'failed';
  }
}

export function buildAutomationTaskSubtitle(
  pageContext: unknown,
): string | null {
  const assessment = assessPageContextData(
    (pageContext ?? null) as AgentChatPageContext | null,
  );
  const parts: string[] = [];
  if (assessment.page) {
    parts.push(assessment.page);
  }
  if (assessment.entityType && assessment.entityId) {
    parts.push(`${assessment.entityType} ${assessment.entityId}`);
  } else if (assessment.entityId) {
    parts.push(`entity ${assessment.entityId}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function toTimeline(steps: unknown): AutomationTaskTimelineEntry[] {
  return toPublicPageActionRunTimeline(steps);
}

export function toAutomationTaskFromPageActionRun(
  row: AutomationPageActionRunRow,
): AutomationTaskListItem {
  const workflow = row.pageAction.workflow;
  return {
    ref: { kind: 'page_action_run', id: row.id },
    triggerSource: 'page_action',
    taskStatus: mapRunStatus(row.status),
    title: row.pageAction.name,
    subtitle: buildAutomationTaskSubtitle(row.pageContext),
    pageActionKey: row.pageActionKey,
    workflowKey: workflow?.workflowKey ?? null,
    workflowName: workflow?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    durationMs: row.durationMs,
    approval: row.approvalRequest
      ? { id: row.approvalRequest.id, status: row.approvalRequest.status }
      : null,
    outputs: {
      preview: previewText(row.fillText),
      hasFillText: Boolean(row.fillText?.trim()),
    },
  };
}

export function toAutomationTaskDetailFromPageActionRun(
  row: AutomationPageActionRunRow,
): AutomationTaskDetail {
  return {
    ...toAutomationTaskFromPageActionRun(row),
    actionKey: row.pageAction.actionKey,
    instruction: row.instruction,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    streamUrl: buildPageActionRunStreamPath(row.id),
    timeline: toTimeline(row.steps),
    workflowRun: row.workflowRun,
  };
}

export function resolvePageActionRunStatusWhere(
  status?: string,
): Prisma.PageActionRunWhereInput['status'] | Prisma.EnumPageActionRunStatusFilter | undefined {
  if (!status || status === 'all') {
    return undefined;
  }
  if (status === 'active') {
    return { in: ['running', 'awaiting_approval'] };
  }
  return status as PageActionRunStatus;
}
