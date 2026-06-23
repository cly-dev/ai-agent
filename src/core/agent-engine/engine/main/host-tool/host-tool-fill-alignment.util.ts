import type { ToolObservation } from '../types/agent-engine.types';
import {
  PLAN_DRAFT_REPLY_OBSERVATION_NAME,
  type PlanDraftReplyObservationOutput,
} from '../plan-present/plan-draft-reply.util';
import {
  resolveHostToolFillTextFromPlanDraft,
  resolvePlanDraftTextForHostTool,
} from '../plan-present/plan-draft-host-tool.util';
import type { MessageBlock } from '../../message/message-blocks.types';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import {
  formatPlanContextForSummarize,
  getPendingPlanHostToolStep,
  getPendingPlanStep,
} from '../plan/task-plan.util';
import { HOST_TOOL_INVOKE_OBSERVATION_NAME } from './host-tool-plan.util';

const HOST_TOOL_TEXT_ARG_KEYS = ['text', 'content', 'value', 'draft', 'body'];

export function findPrecedingReasonStepId(
  plan: TaskPlanSnapshot,
  beforeStepId: string,
): string | null {
  const idx = plan.steps.findIndex((step) => step.id === beforeStepId);
  if (idx <= 0) {
    return null;
  }
  for (let i = idx - 1; i >= 0; i -= 1) {
    const step = plan.steps[i];
    if (step.kind === 'reason') {
      return step.id;
    }
  }
  return null;
}

function extractTextFromHostToolArguments(
  args: Record<string, unknown> | undefined,
): string | null {
  if (!args) {
    return null;
  }
  for (const key of HOST_TOOL_TEXT_ARG_KEYS) {
    const value = args[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

/** 从已 dispatch 的 host_tool_invoke 观测取回填正文。 */
export function extractHostToolDispatchedFillText(input: {
  observations: ToolObservation[];
  planStepId?: string | null;
}): string | null {
  for (let i = input.observations.length - 1; i >= 0; i -= 1) {
    const row = input.observations[i];
    if (row?.name !== HOST_TOOL_INVOKE_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as Record<string, unknown>;
    if (output?.outcome !== 'dispatched') {
      continue;
    }
    if (
      input.planStepId &&
      output.planStepId &&
      output.planStepId !== input.planStepId
    ) {
      continue;
    }
    const args = output.arguments as Record<string, unknown> | undefined;
    const text = extractTextFromHostToolArguments(args);
    if (text) {
      return text;
    }
  }
  return null;
}

/** host_tool 步优先使用紧邻 reason 步的 plan_draft_reply，避免误用陈旧 artifact。 */
export function resolveReasonDraftForHostToolStep(input: {
  taskPlan: TaskPlanSnapshot;
  observations: ToolObservation[];
  artifactBlocks?: MessageBlock[] | null;
}): string | null {
  const hostStep = getPendingPlanHostToolStep(input.taskPlan);
  if (!hostStep) {
    return resolvePlanDraftTextForHostTool({
      observations: input.observations,
      artifactBlocks: input.artifactBlocks,
    });
  }
  const reasonStepId = findPrecedingReasonStepId(input.taskPlan, hostStep.id);
  if (reasonStepId) {
    for (let i = input.observations.length - 1; i >= 0; i -= 1) {
      const row = input.observations[i];
      if (row?.name !== PLAN_DRAFT_REPLY_OBSERVATION_NAME) {
        continue;
      }
      const output = row.output as PlanDraftReplyObservationOutput;
      if (output.planStepId && output.planStepId !== reasonStepId) {
        continue;
      }
      const draft = output.draftReply?.trim();
      if (draft) {
        const fillText = resolveHostToolFillTextFromPlanDraft(draft);
        if (fillText.trim().length > 0) {
          return fillText;
        }
      }
    }
  }
  return resolvePlanDraftTextForHostTool({
    observations: input.observations,
    artifactBlocks: input.artifactBlocks,
  });
}

export function buildPlanContextForSummarize(
  plan: TaskPlanSnapshot | null | undefined,
  observations?: ToolObservation[],
): string | null {
  const base = formatPlanContextForSummarize(plan);
  const hostFill =
    plan && observations?.length
      ? formatHostToolFillContextForTerminalSummarize(plan, observations)
      : null;
  if (!base && !hostFill) {
    return null;
  }
  return [base, hostFill].filter(Boolean).join('\n\n');
}

/** 终稿 summarize 前若刚执行 host_tool，要求与用户可见回填正文一致。 */
export function formatHostToolFillContextForTerminalSummarize(
  plan: TaskPlanSnapshot | null | undefined,
  observations: ToolObservation[],
): string | null {
  const pending = getPendingPlanStep(plan);
  if (!pending || pending.kind !== 'summarize') {
    return null;
  }
  const completed = plan?.completedStepIds ?? [];
  const lastCompletedId = completed[completed.length - 1];
  if (!lastCompletedId) {
    return null;
  }
  const lastCompleted = plan?.steps.find((step) => step.id === lastCompletedId);
  if (lastCompleted?.kind !== 'host_tool') {
    return null;
  }
  const fillText = extractHostToolDispatchedFillText({
    observations,
    planStepId: lastCompletedId,
  });
  if (!fillText) {
    return null;
  }
  return [
    'Host tool fill (already pushed to page UI):',
    fillText,
    'Terminal summary must stay consistent with the pushed body. You may add brief framing but must not contradict or replace the pushed text.',
  ].join('\n');
}
