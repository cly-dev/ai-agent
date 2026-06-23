import { extractSubmitTextFromDraftReply } from '../../../../tool-engine/write-tool-draft-injection.util';
import type { GraphToolCall, ToolObservation } from '../types/agent-engine.types';
import { resolvePlanDraftReplyText } from './plan-draft-reply.util';
import type { MessageBlock } from '../../message/message-blocks.types';
import type { TaskPlanStep } from '../plan/task-plan.types';

/** 从 plan reason/summarize 草稿中提取应传入 Host Tool 的正文（去掉首尾说明性包裹）。 */
export function resolveHostToolFillTextFromPlanDraft(draft: string): string {
  const trimmed = draft.trim();
  if (!trimmed) {
    return '';
  }
  const fromFence = extractSubmitTextFromDraftReply(trimmed);
  if (fromFence !== trimmed) {
    return fromFence;
  }
  const lines = trimmed.split('\n');
  const bodyStart = lines.findIndex(
    (line, index) => index > 0 && line.trim().length > 0 && !/^[(（]/.test(line.trim()),
  );
  if (bodyStart > 0) {
    const body = lines.slice(bodyStart).join('\n');
    const metaStart = body.search(/\n[（(]/);
    return (metaStart >= 0 ? body.slice(0, metaStart) : body).trim();
  }
  const metaStart = trimmed.search(/\n[（(]/);
  return (metaStart >= 0 ? trimmed.slice(0, metaStart) : trimmed).trim();
}

export function resolvePlanDraftTextForHostTool(input: {
  observations: ToolObservation[];
  artifactBlocks?: MessageBlock[] | null;
}): string | null {
  const draft = resolvePlanDraftReplyText(input);
  if (!draft?.trim()) {
    return null;
  }
  const fillText = resolveHostToolFillTextFromPlanDraft(draft);
  return fillText.trim().length > 0 ? fillText : null;
}

export function buildDeterministicHostToolCallsFromDraft(input: {
  hostToolNames: string[];
  draftText: string;
  textArgKey?: string;
}): GraphToolCall[] {
  const text = input.draftText.trim();
  if (!text || input.hostToolNames.length === 0) {
    return [];
  }
  const argKey = input.textArgKey?.trim() || 'text';
  return input.hostToolNames.map((name) => ({
    name,
    arguments: { [argKey]: text },
  }));
}

/** host_tool 步：用 plan 草稿覆盖 LLM 产出中的正文参数。 */
export function applyPlanDraftToHostToolCalls(
  hostCalls: GraphToolCall[],
  draftText: string | null | undefined,
): GraphToolCall[] {
  const text = draftText?.trim();
  if (!text) {
    return hostCalls;
  }
  const textKeys = ['text', 'content', 'value', 'draft', 'body'];
  return hostCalls.map((call) => {
    const args = {
      ...(call.arguments as Record<string, unknown>),
    };
    const existingKey = textKeys.find((key) => key in args);
    return {
      ...call,
      arguments: {
        ...args,
        [existingKey ?? 'text']: text,
      },
    };
  });
}

/** 有 plan 草稿时优先用草稿生成/覆盖 host_tool calls；无草稿则回退 LLM 产出。 */
export function resolveHostToolCallsWithPlanDraft(input: {
  pendingHostStep: TaskPlanStep;
  hostToolsForPrompt: Array<{ name: string }>;
  observations: ToolObservation[];
  artifactBlocks?: MessageBlock[] | null;
  llmHostCalls?: GraphToolCall[];
}): GraphToolCall[] {
  const draftText = resolvePlanDraftTextForHostTool({
    observations: input.observations,
    artifactBlocks: input.artifactBlocks,
  });
  if (!draftText) {
    return input.llmHostCalls ?? [];
  }
  if (input.llmHostCalls?.length) {
    return applyPlanDraftToHostToolCalls(input.llmHostCalls, draftText);
  }
  const allowedNames = input.pendingHostStep.hostToolNames?.length
    ? input.pendingHostStep.hostToolNames
        .map((name) => name.trim())
        .filter(Boolean)
    : input.hostToolsForPrompt.map((tool) => tool.name);
  const allowedSet = new Set(allowedNames);
  return buildDeterministicHostToolCallsFromDraft({
    hostToolNames: input.hostToolsForPrompt
      .map((tool) => tool.name)
      .filter((name) => allowedSet.has(name)),
    draftText,
  });
}
