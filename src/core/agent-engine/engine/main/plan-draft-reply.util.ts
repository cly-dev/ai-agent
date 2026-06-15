import { messageBlocksToPlainText } from '../message/message-blocks.util';
import type { MessageBlock } from '../message/message-blocks.types';
import {
  extractSubmitTextFromDraftReply,
  extractSubmitTextFromWriteArguments,
  injectDraftIntoWriteToolArguments,
  isUsablePlanDraftSubmitText,
} from '../../../tool-engine/write-tool-draft-injection.util';
import type { AgentEngineTool, GraphToolCall, ToolObservation } from './agent-engine.types';
import {
  PLAN_COMPOSE_WRITE_OBSERVATION_NAME,
  type PlanComposeWriteObservationOutput,
} from './plan-compose-write.util';
import {
  getPendingPlanToolStep,
  isPlanWriteToolStep,
} from './task-plan.util';
import type { TaskPlanSnapshot } from './task-plan.types';
import { isMutationTool } from '../tool/tool-execution-status.util';

/** Plan 中间 summarize（draft 步）产出，供后续 write 步与写确认使用。 */
export const PLAN_DRAFT_REPLY_OBSERVATION_NAME = 'plan_draft_reply';

export type PlanDraftReplyObservationOutput = {
  draftReply: string;
  submitText: string;
  planStepId?: string | null;
  pendingWriteToolCall?: {
    tool: string;
    arguments: Record<string, unknown>;
  } | null;
};

export function buildPlanDraftReplyObservation(input: {
  draftReply: string;
  submitText?: string | null;
  planStepId?: string | null;
  pendingWriteToolCall?: GraphToolCall | null;
}): ToolObservation {
  const draftReply = input.draftReply.trim();
  const submitText =
    input.submitText?.trim() || extractSubmitTextFromDraftReply(draftReply);
  return {
    name: PLAN_DRAFT_REPLY_OBSERVATION_NAME,
    output: {
      draftReply,
      submitText,
      planStepId: input.planStepId ?? null,
      pendingWriteToolCall: input.pendingWriteToolCall
        ? {
            tool: input.pendingWriteToolCall.name,
            arguments: input.pendingWriteToolCall.arguments,
          }
        : null,
    } satisfies PlanDraftReplyObservationOutput,
    quality: 'high',
  };
}

export function resolveLatestPlanDraftReply(
  observations: ToolObservation[],
): PlanDraftReplyObservationOutput | null {
  for (let i = observations.length - 1; i >= 0; i -= 1) {
    const row = observations[i];
    if (row?.name !== PLAN_DRAFT_REPLY_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as PlanDraftReplyObservationOutput;
    if (output?.draftReply?.trim()) {
      return output;
    }
  }
  return null;
}

export function resolvePlanDraftReplyText(input: {
  observations: ToolObservation[];
  artifactBlocks?: MessageBlock[] | null;
}): string | null {
  for (let i = input.observations.length - 1; i >= 0; i -= 1) {
    const row = input.observations[i];
    if (row?.name !== PLAN_DRAFT_REPLY_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as PlanDraftReplyObservationOutput;
    const text = output?.draftReply?.trim();
    if (text) {
      return text;
    }
  }
  if (input.artifactBlocks && input.artifactBlocks.length > 0) {
    const plain = messageBlocksToPlainText(input.artifactBlocks).trim();
    return plain.length > 0 ? plain : null;
  }
  return null;
}

export function resolvePlanSubmitTextForWrite(input: {
  observations: ToolObservation[];
  artifactBlocks?: MessageBlock[] | null;
  scopedTools?: AgentEngineTool[];
}): string | null {
  for (let i = input.observations.length - 1; i >= 0; i -= 1) {
    const row = input.observations[i];
    if (row?.name !== PLAN_DRAFT_REPLY_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as PlanDraftReplyObservationOutput;
    const submitText = output?.submitText?.trim();
    if (submitText) {
      return submitText;
    }
    const draftReply = output?.draftReply?.trim();
    if (draftReply) {
      return extractSubmitTextFromDraftReply(draftReply);
    }
  }
  for (let i = input.observations.length - 1; i >= 0; i -= 1) {
    const row = input.observations[i];
    if (row?.name !== PLAN_COMPOSE_WRITE_OBSERVATION_NAME) {
      continue;
    }
    const output = row.output as PlanComposeWriteObservationOutput;
    const toolName = output?.tool?.trim();
    const args = output?.arguments;
    if (!toolName || !args || typeof args !== 'object' || Array.isArray(args)) {
      continue;
    }
    const writeTool = input.scopedTools?.find((tool) => tool.name === toolName);
    if (writeTool) {
      const fromArgs = extractSubmitTextFromWriteArguments(args, writeTool);
      if (fromArgs && isUsablePlanDraftSubmitText(fromArgs)) {
        return fromArgs.trim();
      }
    }
  }
  const draft = resolvePlanDraftReplyText(input);
  return draft ? extractSubmitTextFromDraftReply(draft) : null;
}

/** write 步：按 schema 将 submit 正文写入 LLM 产出的 arguments。 */
export function applyPlanDraftToWriteToolCalls(
  toolCalls: GraphToolCall[],
  taskPlan: TaskPlanSnapshot | null | undefined,
  scopedTools: AgentEngineTool[],
  submitText: string | null | undefined,
): GraphToolCall[] {
  const text = submitText?.trim();
  if (!text || !isPlanWriteToolStep(getPendingPlanToolStep(taskPlan))) {
    return toolCalls;
  }
  return toolCalls.map((call) => {
    const def = scopedTools.find((tool) => tool.name === call.name);
    if (!def || !isMutationTool(def.agentMetadata)) {
      return call;
    }
    return {
      ...call,
      arguments: injectDraftIntoWriteToolArguments(
        call.arguments as Record<string, unknown>,
        text,
        def,
      ),
    };
  });
}
