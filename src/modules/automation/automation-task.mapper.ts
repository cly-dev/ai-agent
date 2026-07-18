import type { PageActionRunStatus, Prisma } from '../../../generated/prisma/client';
import { buildPageActionRunStreamPath } from '../../core/page-action/page-action.constants';
import { resolvePageActionRunOutputText } from '../../core/page-action/resolve-page-action-run-output-text.util';
import { toPublicPageActionRunTimeline } from '../../core/page-action/page-action-run-steps.util';
import { resolvePageActionRunOutcome } from '../../core/page-action/page-action-task-status.util';
import type { AgentChatPageContext } from '../../core/host-bridge/page-context.types';
import { assessPageContextData } from '../../core/host-bridge/page-context-usage.util';
import type {
  AutomationTaskDetail,
  AutomationTaskListItem,
  AutomationTaskTimelineEntry,
} from './automation.types';

export const AUTOMATION_PAGE_ACTION_RUN_INCLUDE = {
  pageAction: {
    select: {
      actionKey: true,
      name: true,
      workflowId: true,
      flowId: true,
      workflow: { select: { workflowKey: true, name: true } },
      flow: { select: { flowKey: true, name: true } },
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

function isTerminalRunStatus(status: PageActionRunStatus): boolean {
  return (
    status === 'completed' || status === 'failed' || status === 'cancelled'
  );
}

function resolveTaskOutputText(row: AutomationPageActionRunRow): string | null {
  return resolvePageActionRunOutputText({
    fillText: row.fillText,
    errorMessage: row.errorMessage,
    steps: row.steps,
  });
}

function buildTaskOutputs(
  row: AutomationPageActionRunRow,
  options?: { includeFullText: boolean },
): AutomationTaskListItem['outputs'] {
  const outputText = resolveTaskOutputText(row);
  const includeFullText = options?.includeFullText === true;
  return {
    preview: includeFullText
      ? outputText
      : previewText(outputText),
    fillText: includeFullText ? outputText : null,
    hasFillText: Boolean(outputText),
  };
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
  // PageAction 绑 Flow 时无 workflow 关系；用 flowKey/name 回填公开字段。
  const workflow = row.pageAction.workflow;
  const flow = row.pageAction.flow;
  const outcome = resolvePageActionRunOutcome({
    status: row.status,
    errorCode: row.errorCode,
  });
  return {
    ref: { kind: 'page_action_run', id: row.id },
    triggerSource: 'page_action',
    taskStatus: outcome.taskStatus,
    succeeded: outcome.succeeded,
    title: row.pageAction.name,
    subtitle: buildAutomationTaskSubtitle(row.pageContext),
    pageActionKey: row.pageActionKey,
    workflowKey: workflow?.workflowKey ?? flow?.flowKey ?? null,
    workflowName: workflow?.name ?? flow?.name ?? null,
    createdAt: row.createdAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    durationMs: row.durationMs,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    approval: row.approvalRequest
      ? { id: row.approvalRequest.id, status: row.approvalRequest.status }
      : null,
    outputs: buildTaskOutputs(row, {
      includeFullText: isTerminalRunStatus(row.status),
    }),
  };
}

export function toAutomationTaskDetailFromPageActionRun(
  row: AutomationPageActionRunRow,
): AutomationTaskDetail {
  const listItem = toAutomationTaskFromPageActionRun(row);
  const fillText = resolveTaskOutputText(row);
  return {
    ...listItem,
    outputs: {
      ...listItem.outputs,
      preview: fillText,
      fillText,
      hasFillText: Boolean(fillText),
    },
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
