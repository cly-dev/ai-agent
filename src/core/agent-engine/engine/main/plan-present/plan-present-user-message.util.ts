import type { MessageBlock } from '../../message/message-blocks.types';
import {
  ensureAtLeastOneTextBlock,
  sanitizeSummarizeUserFacingProse,
  serializeMessageBlocksForStorage,
  textBlock,
} from '../../message/message-blocks.util';
import {
  sanitizeLlmFinalOutput,
  sanitizeTextForStorage,
} from '../../llm-output-sanitize.util';
import type { AgentEngineTool } from '../types/agent-engine.types';
import type { PlanComposeWriteObservationOutput } from './plan-compose-write.util';
import {
  buildPlanPresentUserLayer,
  type PlanDraftSummarizePendingWrite,
} from './plan-draft-summarize.util';
import type { AgentRunSseEmitter } from '../run/agent-run-sse.emitter';
import type { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';

/** 用户聊天层：SSE draft、DB message blocks、`plan_draft_reply.draftReply`。 */
export type PlanPresentUserLayerSnapshot = PlanDraftSummarizePendingWrite & {
  blocks: MessageBlock[];
  serialized: string;
};

/** 机器层：`plan_compose_write` 真值（不进用户 Markdown）。 */
export type PlanPresentMachineLayerSnapshot = {
  machineLayer: PlanComposeWriteObservationOutput;
  machineLayerDirty: boolean;
};

export type PlanPresentUserLayerPublishDeps = {
  sse: Pick<AgentRunSseEmitter, 'publishAssistantBlocks'>;
  assistantArtifact: Pick<
    RunAssistantArtifactStore,
    'peekBlocks' | 'peekTurnId'
  >;
};

/** present 用户可见正文净化（与落库 sanitize 一致）。 */
export function sanitizePlanPresentUserMarkdown(raw: string): string {
  return sanitizeSummarizeUserFacingProse(sanitizeTextForStorage(raw)).trim();
}

/** 解析用户可见 Markdown：流式/LLM 正文优先，其次机器层 submit 最小兜底。 */
export function resolvePlanPresentUserMarkdown(input: {
  streamedOrLlmMarkdown: string;
  machineSubmitText?: string | null;
}): string {
  const fromStream = sanitizePlanPresentUserMarkdown(input.streamedOrLlmMarkdown);
  if (fromStream) {
    return fromStream;
  }
  const submit = input.machineSubmitText?.trim();
  return submit ? sanitizeLlmFinalOutput(submit).trim() : '';
}

export function buildPlanPresentUserMessageBlocks(
  userMarkdown: string,
): MessageBlock[] {
  const display = userMarkdown.trim();
  return ensureAtLeastOneTextBlock(
    display ? [textBlock(display, 'markdown')] : [],
    display,
  );
}

/**
 * present 用户层唯一发布出口：delta 已在流式阶段发出，此处只 commit 权威 full + artifact。
 */
export function publishPlanPresentUserLayer(
  deps: PlanPresentUserLayerPublishDeps,
  input: {
    sessionId: string;
    runId: number;
    turnId?: number;
    userMarkdown: string;
    machineSubmitText?: string | null;
  },
): Pick<PlanPresentUserLayerSnapshot, 'draftReply' | 'blocks' | 'serialized'> {
  const draftReply = resolvePlanPresentUserMarkdown({
    streamedOrLlmMarkdown: input.userMarkdown,
    machineSubmitText: input.machineSubmitText,
  });
  if (!draftReply) {
    const existing =
      deps.assistantArtifact.peekBlocks(input.sessionId, input.runId) ?? [];
    return {
      draftReply: '',
      blocks: existing,
      serialized: serializeMessageBlocksForStorage(existing),
    };
  }
  const merged = buildPlanPresentUserMessageBlocks(draftReply);
  const hasText = merged.some(
    (block) => block.type === 'text' && block.content.trim().length > 0,
  );
  if (!hasText) {
    const existing =
      deps.assistantArtifact.peekBlocks(input.sessionId, input.runId) ?? [];
    return {
      draftReply: '',
      blocks: existing,
      serialized: serializeMessageBlocksForStorage(existing),
    };
  }
  const turnId =
    input.turnId ??
    deps.assistantArtifact.peekTurnId(input.sessionId, input.runId) ??
    undefined;
  const blocks = deps.sse.publishAssistantBlocks(
    input.sessionId,
    input.runId,
    merged,
    { turnId, phase: 'draft' },
  );
  return {
    draftReply,
    blocks,
    serialized: serializeMessageBlocksForStorage(blocks),
  };
}

/**
 * present 用户层定稿：由 LLM 正文 + 机器层 compose 解析 draft/submit，并单次 publish。
 */
export function finalizePlanPresentUserLayer(
  deps: PlanPresentUserLayerPublishDeps,
  input: {
    sessionId: string;
    runId: number;
    turnId?: number;
    machineLayer: PlanComposeWriteObservationOutput;
    userMarkdown: string;
    taskPlanBeforeFinalize: TaskPlanSnapshot | null | undefined;
    scopedTools: AgentEngineTool[];
  },
): PlanPresentUserLayerSnapshot {
  const userLayer = buildPlanPresentUserLayer({
    composed: input.machineLayer,
    draftReply: input.userMarkdown,
    taskPlanBeforeFinalize: input.taskPlanBeforeFinalize,
    scopedTools: input.scopedTools,
  });
  const published = publishPlanPresentUserLayer(deps, {
    sessionId: input.sessionId,
    runId: input.runId,
    turnId: input.turnId,
    userMarkdown: userLayer.draftReply,
    machineSubmitText: userLayer.submitText,
  });
  return {
    draftReply: published.draftReply,
    submitText: userLayer.submitText,
    pendingWriteToolCall: null,
    blocks: published.blocks,
    serialized: published.serialized,
  };
}
