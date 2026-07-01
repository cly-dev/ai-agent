import type { PageActionRunStep } from '../../core/page-action/page-action-run-steps.util';
import { PageActionRunStepRecorder } from '../../core/page-action/page-action-run-steps.util';
import type {
  PageActionDetailRow,
  PageActionRunAdminDetail,
  PageActionRunAdminListItem,
  PageActionRunAdminRow,
  PageActionResponse,
} from './page-action.types';

export function toPageActionResponse(row: PageActionDetailRow): PageActionResponse {
  return {
    id: row.id,
    appClientId: row.appClientId,
    appClientName: row.appClient?.name,
    actionKey: row.actionKey,
    name: row.name,
    description: row.description,
    hostToolId: row.hostToolId,
    hostToolName: row.hostTool.name,
    pageScope: row.pageScope,
    systemPrompt: row.systemPrompt,
    defaultDelivery: row.defaultDelivery,
    allowCustomInstruction: row.allowCustomInstruction,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    config: row.config,
    sourceSkillId: row.sourceSkillId,
    workflowId: row.workflowId,
    workflowVersion: row.workflowVersion,
    workflowOverrides: row.workflowOverrides,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseRunSteps(value: unknown): PageActionRunStep[] {
  return PageActionRunStepRecorder.fromJson(value).toJson();
}

function stepCount(value: unknown): number {
  return parseRunSteps(value).length;
}

export function toPageActionRunAdminListItem(
  row: PageActionRunAdminRow,
): PageActionRunAdminListItem {
  return {
    id: row.id,
    pageActionId: row.pageActionId,
    actionKey: row.pageAction.actionKey,
    pageActionName: row.pageAction.name,
    userId: row.userId,
    username: row.user?.username ?? null,
    userEmail: row.user?.email ?? null,
    status: row.status,
    generation: row.generation,
    dslOutcome: row.dslOutcome,
    errorCode: row.errorCode,
    streamId: row.streamId,
    clientActionId: row.clientActionId,
    model: row.model,
    durationMs: row.durationMs,
    stepCount: stepCount(row.steps),
    createdAt: row.createdAt,
    finishedAt: row.finishedAt,
  };
}

export function toPageActionRunAdminDetail(
  row: PageActionRunAdminRow,
): PageActionRunAdminDetail {
  return {
    ...toPageActionRunAdminListItem(row),
    delivery: row.delivery,
    instruction: row.instruction,
    context: row.context,
    pageContext: row.pageContext,
    fillText: row.fillText,
    errorMessage: row.errorMessage,
    promptTokens: row.promptTokens,
    completionTokens: row.completionTokens,
    idempotencyKey: row.idempotencyKey,
    workflowId: row.workflowId,
    workflowVersion: row.workflowVersion,
    workflowRun: row.workflowRun,
    steps: parseRunSteps(row.steps),
  };
}
