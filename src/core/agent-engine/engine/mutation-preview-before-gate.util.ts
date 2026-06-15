import { messageBlocksToPlainText } from './message/message-blocks.util';
import type { AgentEngineTool, ToolObservation } from './main/agent-engine.types';
import {
  resolveLatestPlanDraftReply,
} from './main/plan-draft-reply.util';
import {
  isUsablePlanMutationPreviewDraft,
} from './main/plan-draft-summarize.util';
import type { RunAssistantArtifact } from './main/run-assistant-artifact.store';
import type { WriteConfirmationToolCall } from './write-confirmation-gate.util';
import { formatWriteToolArgumentsForUserPreview } from '../../tool-engine/write-tool-draft-injection.util';

const MIN_PREVIEW_SUBSTANTIVE_CHARS = 12;

/** 写/删确认前是否已有用户可见的操作预览（present 草稿或 draft phase artifact）。 */
export function hasUserVisibleMutationPreview(input: {
  artifact: RunAssistantArtifact | null;
  observations: ToolObservation[];
}): boolean {
  if (input.artifact?.phase === 'draft') {
    const plain = messageBlocksToPlainText(input.artifact.blocks).trim();
    if (plain.replace(/\s/g, '').length >= MIN_PREVIEW_SUBSTANTIVE_CHARS) {
      return true;
    }
  }
  const draftReply = resolveLatestPlanDraftReply(input.observations);
  if (!draftReply?.draftReply?.trim()) {
    return false;
  }
  return isUsablePlanMutationPreviewDraft(draftReply.draftReply);
}

/** 写操作参数校验失败时展示给用户（无业务字段硬编码）。 */
export function buildMutationArgsInvalidUserMessage(): string {
  return '写操作参数未通过校验，系统正在重新整理，请稍候。';
}

/** 无法生成可确认预览时展示给用户。 */
export function buildMutationPreviewUnavailableUserMessage(): string {
  return '无法生成可确认的操作预览，请补充必要信息后重试。';
}

/** 无 plan present 时，从 schema 参数生成最小可读变更预览（供 gate 前 SSE draft）。 */
export function buildMutationPreviewMarkdownFromWriteCalls(
  writeCalls: WriteConfirmationToolCall[],
  scopedTools: AgentEngineTool[],
): string {
  const byName = new Map(scopedTools.map((tool) => [tool.name, tool]));
  const sections: string[] = [];
  for (const call of writeCalls) {
    const def = byName.get(call.name);
    if (!def) {
      continue;
    }
    const body = formatWriteToolArgumentsForUserPreview(
      call.arguments,
      def,
      def.description,
    );
    if (body.trim()) {
      sections.push(body.trim());
    }
  }
  return sections.join('\n\n');
}
