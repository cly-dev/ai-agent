import { buildWriteConfirmationUserMessage } from './write-confirmation-gate.util';
import type { MessageBlock } from './message/message-blocks.types';
import {
  filterLlmBlocksAvoidDuplicatingRule,
  isStructuredMessageBlock,
  mergeMessageBlocks,
  sanitizeMessageBlocks,
  tryParseStoredMessageBlocks,
} from './message/message-blocks.util';

/** 从 primary artifact 快照解析用户已确认的 preview blocks。 */
export function parseConfirmedPreviewBlocks(
  serialized: string | null | undefined,
): MessageBlock[] {
  const trimmed = serialized?.trim() ?? '';
  if (!trimmed) {
    return [];
  }
  const blocks =
    tryParseStoredMessageBlocks(trimmed) ??
    (trimmed
      ? [{ type: 'text' as const, content: trimmed, format: 'markdown' as const }]
      : []);
  return stripWriteConfirmationPromptBlocks(
    blocks,
    buildWriteConfirmationUserMessage(),
  ).filter(
    (block) => !(block.type === 'text' && block.content.trim().length === 0),
  );
}

/** 去掉历史数据中误入 artifact 的 gate 文案（新流程 gate 仅走 confirmation_required SSE）。 */
export function stripWriteConfirmationPromptBlocks(
  blocks: MessageBlock[],
  gateMessage: string,
): MessageBlock[] {
  const gate = gateMessage.trim();
  if (!gate) {
    return sanitizeMessageBlocks(blocks);
  }
  return sanitizeMessageBlocks(
    blocks.filter(
      (block) =>
        !(block.type === 'text' && block.content.trim() === gate),
    ),
  );
}

/** 写确认续跑：metric / alert 等执行状态块（不含 prose fallback）。 */
export function extractWriteConfirmExecutionStatusBlocks(
  blocks: MessageBlock[],
): MessageBlock[] {
  return sanitizeMessageBlocks(blocks.filter(isStructuredMessageBlock));
}

/**
 * 写确认成功终稿：preview 正文 + 工具执行产生的结构化状态块。
 * 正文来自 gate 时固化的 primary artifact，状态块来自 payload / observation 规则化。
 */
export function mergeConfirmedPreviewWithExecutionStatus(input: {
  confirmedPreview: MessageBlock[];
  executionStatusBlocks: MessageBlock[];
  observationStructuredBlocks?: MessageBlock[];
}): MessageBlock[] {
  const preview = sanitizeMessageBlocks(input.confirmedPreview);
  if (preview.length === 0) {
    return [];
  }
  const statusBlocks = extractWriteConfirmExecutionStatusBlocks(
    input.executionStatusBlocks,
  );
  const fromObservation = sanitizeMessageBlocks(
    (input.observationStructuredBlocks ?? []).filter(isStructuredMessageBlock),
  );
  const extras = filterLlmBlocksAvoidDuplicatingRule(
    preview,
    mergeMessageBlocks(statusBlocks, fromObservation),
  );
  return sanitizeMessageBlocks(mergeMessageBlocks(preview, extras));
}
