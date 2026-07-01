import type { MessageBlock } from '../../message/message-blocks.types';
import {
  ensureAtLeastOneTextBlock,
  serializeMessageBlocksForStorage,
  textBlock,
} from '../../message/message-blocks.util';
import {
  sanitizeLlmFinalOutput,
  sanitizeTextForStorage,
} from '../../llm-output-sanitize.util';
import type { PlanHostFillEntry } from './plan-host-fill.util';
import { extractPrimaryFillTextFromHostFills } from './plan-host-fill.util';
import { readHostToolStringArg } from '../../../../host-bridge/host-tool-string-arg.util';
import type { AgentRunSseEmitter } from '../run/agent-run-sse.emitter';
import type { RunAssistantArtifactStore } from '../run/run-assistant-artifact.store';

function readFillDisplayText(fill: PlanHostFillEntry): string {
  return readHostToolStringArg(fill.arguments) ?? '';
}

/** 用户层 Markdown：展示机器层 fill 正文（确定性模板，非第二趟 LLM）。 */
export function buildPlanReasonHostUserMarkdown(input: {
  fills: PlanHostFillEntry[];
  stepObjective?: string | null;
}): string {
  const primary = extractPrimaryFillTextFromHostFills(input.fills);
  if (!primary) {
    return '';
  }
  const objective = input.stepObjective?.trim();
  const sections: string[] = [];
  if (objective) {
    sections.push(objective);
    sections.push('');
  }
  for (const fill of input.fills) {
    const body = readFillDisplayText(fill);
    if (!body) {
      continue;
    }
    sections.push(`\`\`\`text`, body, '```');
    sections.push('');
  }
  return sanitizeLlmFinalOutput(sanitizeTextForStorage(sections.join('\n').trim()));
}

export type PlanReasonHostUserLayerPublishDeps = {
  sse: Pick<AgentRunSseEmitter, 'publishAssistantBlocks'>;
  assistantArtifact: Pick<
    RunAssistantArtifactStore,
    'peekBlocks' | 'peekTurnId'
  >;
};

export function publishPlanReasonHostUserLayer(
  deps: PlanReasonHostUserLayerPublishDeps,
  input: {
    sessionId: string;
    runId: number;
    turnId?: number;
    userMarkdown: string;
  },
): { draftReply: string; blocks: MessageBlock[]; serialized: string } {
  const draftReply = input.userMarkdown.trim();
  if (!draftReply) {
    const existing =
      deps.assistantArtifact.peekBlocks(input.sessionId, input.runId) ?? [];
    return {
      draftReply: '',
      blocks: existing,
      serialized: serializeMessageBlocksForStorage(existing),
    };
  }
  const merged = ensureAtLeastOneTextBlock(
    [textBlock(draftReply, 'markdown')],
    draftReply,
  );
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
