import type { AgentChatPageContext } from '../../host-bridge/page-context.types';
import type { PendingWriteConfirmationSnapshot } from '../../../modules/chat/pending-write-confirmation.types';
import {
  messageBlocksToPlainText,
  serializeMessageBlocksForStorage,
  textBlock,
} from './message/message-blocks.util';
import { parseConfirmedPreviewBlocks } from './write-confirm-resume-blocks.util';

export type WriteConfirmActionKind = 'confirm_write' | 'cancel_write';

export type WriteConfirmActionMessagePersistence = {
  content: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  pageContext: AgentChatPageContext | null;
};

/**
 * 写确认/取消用户消息的落库形态：可读 content + 结构化 toolInput，保留 toolName 标记供列表筛选。
 */
export function buildWriteConfirmActionMessagePersistence(input: {
  action: WriteConfirmActionKind;
  pending: PendingWriteConfirmationSnapshot | null;
  incomingPageContext?: AgentChatPageContext | null;
}): WriteConfirmActionMessagePersistence {
  const toolName =
    input.action === 'cancel_write' ? '__cancel_write__' : '__confirm_write__';
  const actionLabel =
    input.action === 'cancel_write' ? '取消写操作' : '确认写操作';
  const pending = input.pending;
  const toolCalls = pending?.toolCalls ?? [];
  const toolNames = [...new Set(toolCalls.map((call) => call.name))];
  const previewBlocks = parseConfirmedPreviewBlocks(
    pending?.resumeContext?.confirmedPreviewSerialized ?? null,
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
  if (previewPlain) {
    bodyParts.push('', '待执行内容：', previewPlain);
  }

  const content = serializeMessageBlocksForStorage([
    textBlock(bodyParts.join('\n'), 'markdown'),
  ]);

  const toolInput: Record<string, unknown> = {
    action: input.action,
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
