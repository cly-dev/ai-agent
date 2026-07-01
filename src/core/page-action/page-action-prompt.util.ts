import type { LlmChatMessage } from '../llm/llm.types';
import { formatPageContextPromptBlock } from '../host-bridge/page-context.prompt.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';

export function buildPageActionUserContent(input: {
  instruction?: string | null;
  context?: Record<string, unknown> | null;
  pageContext?: AgentChatPageContext | null;
}): string {
  const lines: string[] = [];
  const instruction = input.instruction?.trim();
  if (instruction) {
    lines.push(`User request: ${instruction}`);
  }
  const pageBlock = formatPageContextPromptBlock(input.pageContext);
  if (pageBlock) {
    lines.push(pageBlock);
  }
  if (input.context && Object.keys(input.context).length > 0) {
    lines.push(
      `<context>\n${JSON.stringify(input.context)}\n</context>`,
    );
  }
  if (lines.length === 0) {
    return 'Generate the requested content.';
  }
  return lines.join('\n');
}

export function buildPageActionLlmMessages(input: {
  systemPrompt: string;
  instruction?: string | null;
  context?: Record<string, unknown> | null;
  pageContext?: AgentChatPageContext | null;
}): LlmChatMessage[] {
  return [
    { role: 'system', content: input.systemPrompt.trim() },
    {
      role: 'user',
      content: buildPageActionUserContent({
        instruction: input.instruction,
        context: input.context,
        pageContext: input.pageContext,
      }),
    },
  ];
}
