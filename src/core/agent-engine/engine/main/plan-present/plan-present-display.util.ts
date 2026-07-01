import type { AgentEngineTool } from '../types/agent-engine.types';
import {
  extractSubmitTextFromDraftReply,
  extractSubmitTextFromWriteArguments,
  formatWriteToolArgumentsForUserPreview,
  writeToolHasSubmitBodyPath,
} from '../../../../tool-engine/write-tool-draft-injection.util';

const MIN_PRESENT_CONTEXT_CHARS = 12;

function normalizeComparableText(text: string): string {
  return text.replace(/\s/g, '');
}

/** 用户层展示是否仅为机器层 submit 正文（缺少操作说明语境）。 */
export function isBareMachineSubmitDisplay(
  displayDraft: string,
  machineSubmit: string | null | undefined,
): boolean {
  const display = displayDraft.trim();
  const submit = machineSubmit?.trim() ?? '';
  if (!display || !submit) {
    return false;
  }
  if (normalizeComparableText(display) === normalizeComparableText(submit)) {
    return true;
  }
  const fromFence = extractSubmitTextFromDraftReply(display);
  if (
    fromFence &&
    normalizeComparableText(fromFence) === normalizeComparableText(submit)
  ) {
    const outsideFence = display
      .replace(/```[\w-]*\n[\s\S]*?```/g, '')
      .trim();
    return (
      outsideFence.replace(/\s/g, '').length < MIN_PRESENT_CONTEXT_CHARS
    );
  }
  return false;
}

/**
 * Workflow await_user_confirm 路径：从 compose 机器层参数生成用户预览（与提交真值 1:1）。
 * 参数区走 schema compact；submit 正文逐字放入 fenced block。
 */
export function buildDeterministicMutationPresentMarkdown(input: {
  arguments: Record<string, unknown>;
  writeTool: AgentEngineTool;
}): string {
  const { arguments: args, writeTool } = input;
  const hasSubmitBody = writeToolHasSubmitBodyPath(writeTool);
  const sections: string[] = [];

  const paramsPreview = formatWriteToolArgumentsForUserPreview(
    args,
    writeTool,
    hasSubmitBody ? undefined : writeTool.description,
    hasSubmitBody ? { excludeSubmitBody: true } : undefined,
  );
  if (paramsPreview.trim()) {
    sections.push(paramsPreview.trim());
  }

  if (hasSubmitBody) {
    const submitText = extractSubmitTextFromWriteArguments(args, writeTool)?.trim();
    if (submitText) {
      sections.push(`\`\`\`\n${submitText}\n\`\`\``);
    }
  }

  return sections.join('\n\n');
}
