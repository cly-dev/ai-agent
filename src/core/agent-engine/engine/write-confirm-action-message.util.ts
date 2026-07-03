import type { AgentChatPageContext } from '../../host-bridge/page-context.types';
import type { DraftReviewDecision } from '../../draft-review';
import type { PendingWriteConfirmationSnapshot } from '../../../modules/chat/pending-write-confirmation.types';
import {
  messageBlocksToPlainText,
  serializeMessageBlocksForStorage,
  textBlock,
} from './message/message-blocks.util';
import { parseConfirmedPreviewBlocks } from './write-confirm-resume-blocks.util';

export type WriteConfirmActionKind =
  | 'confirm_write'
  | 'cancel_write'
  | 'retry_write'
  | 'confirm_write_with_edits';

export type WriteConfirmActionMessagePersistence = {
  content: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  pageContext: AgentChatPageContext | null;
};

function resolveActionKind(decision: DraftReviewDecision): WriteConfirmActionKind {
  switch (decision.action) {
    case 'cancel':
      return 'cancel_write';
    case 'retry':
      return 'retry_write';
    case 'confirm_with_edits':
      return 'confirm_write_with_edits';
    default:
      return 'confirm_write';
  }
}

function resolveActionLabel(kind: WriteConfirmActionKind): string {
  switch (kind) {
    case 'cancel_write':
      return '取消写操作';
    case 'retry_write':
      return '重试生成';
    case 'confirm_write_with_edits':
      return '确认写操作（已编辑）';
    default:
      return '确认写操作';
  }
}

function resolveToolName(kind: WriteConfirmActionKind): string {
  switch (kind) {
    case 'cancel_write':
      return '__cancel_write__';
    case 'retry_write':
      return '__retry_write__';
    case 'confirm_write_with_edits':
      return '__confirm_write_edited__';
    default:
      return '__confirm_write__';
  }
}

/**
 * 写确认门用户消息的落库形态：可读 content + 结构化 toolInput，保留 toolName 标记供列表筛选。
 */
export function buildWriteConfirmActionMessagePersistence(input: {
  decision: DraftReviewDecision;
  pending: PendingWriteConfirmationSnapshot | null;
  incomingPageContext?: AgentChatPageContext | null;
}): WriteConfirmActionMessagePersistence {
  const actionKind = resolveActionKind(input.decision);
  const toolName = resolveToolName(actionKind);
  const actionLabel = resolveActionLabel(actionKind);
  const pending = input.pending;
  const toolCalls = pending?.toolCalls ?? [];
  const toolNames = [...new Set(toolCalls.map((call) => call.name))];
  const previewBlocks = parseConfirmedPreviewBlocks(
    input.decision.editedPreviewSerialized ??
      pending?.resumeContext?.confirmedPreviewSerialized ??
      null,
  );
  const previewPlain = messageBlocksToPlainText(previewBlocks).trim();

  const summaryLine =
    toolNames.length > 0
      ? `${actionLabel}：${toolNames.join('、')}`
      : actionLabel;
  const bodyParts = [summaryLine];
  if (pending?.runId != null) {
    bodyParts.push(`关联运行 #${pending.runId}`);
  }
  if (input.decision.retryInstruction?.trim()) {
    bodyParts.push('', '重试说明：', input.decision.retryInstruction.trim());
  }
  if (previewPlain) {
    bodyParts.push('', '待执行内容：', previewPlain);
  }

  const content = serializeMessageBlocksForStorage([
    textBlock(bodyParts.join('\n'), 'markdown'),
  ]);

  const toolInput: Record<string, unknown> = {
    action: actionKind,
    writeGate: input.decision,
    ...(pending
      ? {
          runId: pending.runId,
          turnId: pending.turnId,
          agentId: pending.agentId,
          toolNames,
          toolCallCount: toolCalls.length,
          latestUserMessage: pending.latestUserMessage,
          hasPreview: previewPlain.length > 0,
        }
      : { expired: true }),
  };

  const pageContext =
    input.incomingPageContext ??
    pending?.resumeContext?.pageContext ??
    null;

  return {
    content,
    toolName,
    toolInput,
    pageContext,
  };
}
