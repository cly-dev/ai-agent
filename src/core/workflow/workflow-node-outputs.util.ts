import type { LlmChatMessage } from '../llm/llm.types';

export function formatWorkflowNodeOutputsForPrompt(
  nodeOutputs: Record<string, unknown>,
): string | null {
  const entries = Object.entries(nodeOutputs);
  if (entries.length === 0) {
    return null;
  }
  return entries
    .map(
      ([ref, value]) =>
        `## ${ref}\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``,
    )
    .join('\n\n');
}

export function appendWorkflowNodeOutputsToLlmMessages(
  messages: LlmChatMessage[],
  nodeOutputs: Record<string, unknown> | undefined,
): LlmChatMessage[] {
  if (!nodeOutputs || Object.keys(nodeOutputs).length === 0) {
    return messages;
  }
  const body = formatWorkflowNodeOutputsForPrompt(nodeOutputs);
  if (!body) {
    return messages;
  }
  return [
    ...messages,
    {
      role: 'user',
      content: `Prior workflow step outputs:\n\n${body}`,
    },
  ];
}
