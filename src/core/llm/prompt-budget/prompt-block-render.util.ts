import type { LlmChatMessage } from '../llm.types';
import type { PromptBlock } from './prompt-budget.types';
import { PROMPT_BUDGET_NOTE_TAG } from './prompt-budget.constants';
import {
  serializeObservationsJson,
} from './observation-degrade.util';

function wrapTag(tag: string, body: string): string {
  return `<${tag}>\n${body}\n</${tag}>`;
}

function renderObservationBlock(block: PromptBlock): string {
  if (block.payload.type !== 'observations') {
    return '';
  }
  const serialized = serializeObservationsJson(block.payload.observations);
  const tag =
    block.kind === 'current_run_observations'
      ? 'current_run_observations'
      : 'working_memory_observations';
  const parts: string[] = [];
  if (block.payload.preamble && block.kind === 'working_memory_observations') {
    parts.push(block.payload.preamble);
  }
  if (block.degradeLevel > 0) {
    parts.push(
      wrapTag(
        PROMPT_BUDGET_NOTE_TAG,
        `level=${block.degradeLevel}; observations structurally degraded; full data in session ledger when applicable.`,
      ),
    );
  }
  parts.push(wrapTag(tag, serialized));
  return parts.join('\n');
}

function renderBlockContent(block: PromptBlock): string {
  if (block.degradeLevel === 4) {
    return '';
  }

  switch (block.payload.type) {
    case 'text': {
      if (block.degradeLevel > 0 && block.kind === 'current_run_observations') {
        return `${wrapTag(PROMPT_BUDGET_NOTE_TAG, `level=${block.degradeLevel}; tool result text degraded`)}\n${block.payload.text}`;
      }
      return block.payload.text;
    }
    case 'observations':
      return renderObservationBlock(block);
    case 'tool_schema': {
      const tag =
        block.kind === 'host_tool_schema' ? 'host_tool_schema' : 'tool_schema';
      const prefix =
        block.degradeLevel > 0
          ? `${wrapTag(PROMPT_BUDGET_NOTE_TAG, `level=${block.degradeLevel}; schema degraded`)}\n`
          : '';
      return `${prefix}${wrapTag(tag, block.payload.json)}`;
    }
    case 'session_goa':
      if (!block.payload.text) {
        return '';
      }
      return block.degradeLevel > 0
        ? `${wrapTag(PROMPT_BUDGET_NOTE_TAG, `level=${block.degradeLevel}; goa section=${block.payload.section}`)}\n${block.payload.text}`
        : block.payload.text;
    default:
      return '';
  }
}

/** 同一条 source message 的 blocks 合并为一条 LlmChatMessage，保持原始消息结构。 */
export function renderPromptBlocks(blocks: PromptBlock[]): LlmChatMessage[] {
  const byMessageIndex = new Map<number, PromptBlock[]>();
  for (const block of blocks) {
    const group = byMessageIndex.get(block.sourceMessageIndex) ?? [];
    group.push(block);
    byMessageIndex.set(block.sourceMessageIndex, group);
  }

  const messages: LlmChatMessage[] = [];
  for (const messageIndex of [...byMessageIndex.keys()].sort((a, b) => a - b)) {
    const group = byMessageIndex.get(messageIndex)!;
    const parts = group
      .map((block) => renderBlockContent(block))
      .filter((part) => part.trim().length > 0);
    if (parts.length === 0) {
      continue;
    }
    const anchor = group[0]!;
    messages.push({
      role: anchor.role,
      content: parts.join('\n\n'),
      ...(anchor.toolCallId ? { toolCallId: anchor.toolCallId } : {}),
    });
  }

  return messages;
}

export function estimateBlocksTokens(blocks: PromptBlock[]): number {
  const byMessageIndex = new Map<number, PromptBlock[]>();
  for (const block of blocks) {
    const group = byMessageIndex.get(block.sourceMessageIndex) ?? [];
    group.push(block);
    byMessageIndex.set(block.sourceMessageIndex, group);
  }
  let total = 0;
  for (const group of byMessageIndex.values()) {
    const merged = group
      .map((block) => renderBlockContent(block))
      .filter((part) => part.trim().length > 0)
      .join('\n\n');
    if (!merged) {
      continue;
    }
    let tokens = 0;
    for (const char of merged) {
      tokens += char.codePointAt(0)! <= 0x7f ? 0.25 : 0.5;
    }
    total += Math.ceil(tokens) + 4;
  }
  return total;
}

export function pickNextDegradeCandidate(
  blocks: PromptBlock[],
): PromptBlock | null {
  const candidates = blocks
    .filter((block) => block.degradeLevel < block.maxDegradeLevel)
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }
      if (left.degradeLevel !== right.degradeLevel) {
        return left.degradeLevel - right.degradeLevel;
      }
      return left.id.localeCompare(right.id);
    });
  return candidates[0] ?? null;
}

export function nextDegradeLevel(
  current: import('./prompt-budget.types').DegradeLevel,
): import('./prompt-budget.types').DegradeLevel {
  return Math.min(4, current + 1) as import('./prompt-budget.types').DegradeLevel;
}
